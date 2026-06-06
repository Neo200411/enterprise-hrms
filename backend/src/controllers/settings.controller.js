import { query } from '../config/db.js';

export const getUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch existing settings
    const result = await query(
      `SELECT goal_updates, approval_notifications, weekly_summary, profile_visibility 
       FROM public.user_settings 
       WHERE user_id = $1`,
      [userId]
    );

    // If no row exists, return the schema defaults virtually (or we could physically upsert)
    // The instructions say "return: { goalUpdates, ... }" so we map snake_case to camelCase
    if (result.rows.length === 0) {
      return res.json({
        goalUpdates: true,
        approvalNotifications: true,
        weeklySummary: false,
        profileVisibility: 'public'
      });
    }

    const row = result.rows[0];
    res.json({
      goalUpdates: row.goal_updates,
      approvalNotifications: row.approval_notifications,
      weeklySummary: row.weekly_summary,
      profileVisibility: row.profile_visibility
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.id; // strictly from req.user
    const { goalUpdates, approvalNotifications, weeklySummary, profileVisibility } = req.body;

    // 1. Validate payload
    if (typeof goalUpdates !== 'boolean' || 
        typeof approvalNotifications !== 'boolean' || 
        typeof weeklySummary !== 'boolean') {
      return res.status(400).json({ error: 'goalUpdates, approvalNotifications, and weeklySummary must be boolean' });
    }

    const validVisibilities = ['public', 'private', 'team'];
    if (!validVisibilities.includes(profileVisibility)) {
      return res.status(400).json({ error: 'profileVisibility must be one of: public, private, team' });
    }

    // 2. Perform UPSERT
    const upsertQuery = `
      INSERT INTO public.user_settings (user_id, goal_updates, approval_notifications, weekly_summary, profile_visibility)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id)
      DO UPDATE SET
        goal_updates = EXCLUDED.goal_updates,
        approval_notifications = EXCLUDED.approval_notifications,
        weekly_summary = EXCLUDED.weekly_summary,
        profile_visibility = EXCLUDED.profile_visibility,
        updated_at = NOW()
      RETURNING goal_updates, approval_notifications, weekly_summary, profile_visibility;
    `;

    const result = await query(upsertQuery, [
      userId,
      goalUpdates,
      approvalNotifications,
      weeklySummary,
      profileVisibility
    ]);

    const row = result.rows[0];
    
    // Return the updated shape
    res.json({
      message: 'Settings updated successfully',
      settings: {
        goalUpdates: row.goal_updates,
        approvalNotifications: row.approval_notifications,
        weeklySummary: row.weekly_summary,
        profileVisibility: row.profile_visibility
      }
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
