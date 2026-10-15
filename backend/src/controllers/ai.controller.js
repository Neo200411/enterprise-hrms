// AI goal assistant: turns a rough goal idea into a clear, measurable goal using Groq
// (an OpenAI-compatible API). The AI only suggests — the employee reviews and edits before saving.

const GROQ_BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const TIMEOUT_MS = 15000;

// Must match the options in the goal form
const THRUST_AREAS = ['Financial', 'Operational', 'Customer', 'Learning'];
const UOM_TYPES = ['Percentage', 'Currency', 'Number', 'Days'];
const MEASUREMENT_TYPES = ['Target Based', 'Milestone', 'Continuous'];

const SYSTEM_PROMPT = `You are an HR coach helping an employee write ONE quarterly performance goal.
Rewrite their rough idea into a clear, specific, measurable goal.

Reply with ONLY a JSON object with exactly these keys:
- "goal_title": short title, max 80 characters
- "description": 1-2 sentences saying what will be achieved and how it is measured
- "thrust_area": one of ${THRUST_AREAS.join(', ')}
- "uom_type": one of ${UOM_TYPES.join(', ')}
- "measurement_type": one of ${MEASUREMENT_TYPES.join(', ')}
- "target_value": a positive number that is realistic for one quarter

Rules:
- Progress is scored as actual / target, so HIGHER must always be better.
  Turn "reduce" goals around, e.g. "reduce complaints" -> "resolve 95% of complaints" (Percentage, 95).
- A one-off task (launch, finish, certify) is a Milestone with target_value 1 and uom_type Number.
- Do not invent company names, people or numbers the employee did not imply beyond a sensible target.`;

const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
const positive = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};

// What the employee already chose in the form. These always win over the AI.
const readChoices = (body) => ({
  thrust_area: THRUST_AREAS.includes(body.thrust_area) ? body.thrust_area : null,
  uom_type: UOM_TYPES.includes(body.uom_type) ? body.uom_type : null,
  measurement_type: MEASUREMENT_TYPES.includes(body.measurement_type) ? body.measurement_type : null,
  target_value: positive(body.target_value),
});

// Never trust model output blindly: keep the employee's choices, and coerce
// everything else into something the form accepts
const sanitize = (raw, choices) => ({
  goal_title: String(raw.goal_title || '').trim().slice(0, 80),
  description: String(raw.description || '').trim().slice(0, 500),
  thrust_area: choices.thrust_area || pick(raw.thrust_area, THRUST_AREAS, 'Operational'),
  uom_type: choices.uom_type || pick(raw.uom_type, UOM_TYPES, 'Number'),
  measurement_type: choices.measurement_type || pick(raw.measurement_type, MEASUREMENT_TYPES, 'Target Based'),
  target_value: choices.target_value || positive(raw.target_value) || 1,
});

export const improveGoal = async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'The AI assistant is not set up yet (add GROQ_API_KEY to backend/.env).' });
  }

  // Use whatever the employee has typed so far
  const idea = [req.body.goal_title, req.body.description]
    .map(v => String(v || '').trim())
    .filter(Boolean)
    .join(' — ');

  if (idea.length < 3) {
    return res.status(400).json({ error: 'Type a goal title or a short description first, then ask AI to improve it.' });
  }
  if (idea.length > 600) {
    return res.status(400).json({ error: 'Please keep the goal idea under 600 characters.' });
  }

  // Tell the AI what's already decided so the title and description match it
  const choices = readChoices(req.body);
  const fixed = Object.entries(choices).filter(([, v]) => v !== null);
  const userMessage = fixed.length
    ? `My goal idea: ${idea}\nAlready decided (use exactly these values): ${fixed.map(([k, v]) => `${k} = ${v}`).join(', ')}`
    : `My goal idea: ${idea}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error(`Groq error ${response.status}:`, detail.slice(0, 300));
      const message = response.status === 401
        ? 'The AI key in backend/.env was rejected — check GROQ_API_KEY.'
        : response.status === 429
          ? 'The AI service is busy right now. Please try again in a minute.'
          : 'The AI assistant could not answer right now. Please try again.';
      return res.status(502).json({ error: message });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const suggestion = sanitize(JSON.parse(content), choices);

    if (!suggestion.goal_title || !suggestion.description) {
      return res.status(502).json({ error: 'The AI gave an incomplete answer. Please try again.' });
    }

    res.json({ suggestion });
  } catch (error) {
    const timedOut = error.name === 'AbortError';
    console.error('AI improve-goal failed:', timedOut ? 'timeout' : error.message);
    res.status(502).json({ error: timedOut ? 'The AI took too long to answer. Please try again.' : 'The AI assistant could not answer right now. Please try again.' });
  } finally {
    clearTimeout(timer);
  }
};
