# PrimeHR - Enterprise HRMS Platform

A comprehensive Human Resource Management System built with Next.js, Tailwind CSS, and Recharts. Designed for modern enterprises to manage goals, performance, approvals, and analytics.

## Features

### Core Features
- **User Authentication**: Login and signup pages with role-based access (Employee, Manager, Admin)
- **Goal Management**: Create, track, and manage employee goals with progress updates
- **Performance Tracking**: Real-time performance metrics and scoring
- **Approvals Workflow**: Manager approval system for goal updates and reviews
- **Analytics Dashboard**: Comprehensive analytics with charts and insights
- **Employee Directory**: Manage all employees with search and filtering
- **Audit Logs**: Track all system activities and changes
- **Settings**: User profile, notification preferences, and privacy settings

### User Roles
1. **Employee**: View personal dashboard, manage goals, submit reviews
2. **Manager**: Team management, approvals workflow, team analytics
3. **Admin**: Full system access, employee management, analytics, audit logs

## Tech Stack

- **Framework**: Next.js 16+ with App Router
- **Styling**: Tailwind CSS with custom design tokens
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Animation**: Custom CSS animations and transitions

## Project Structure

```
app/
├── (auth)/
│   ├── login/          # Login page
│   └── signup/         # Signup page
├── admin/
│   ├── analytics/      # Analytics dashboard
│   ├── employees/      # Employee directory
│   └── logs/           # Audit logs
├── approvals/          # Approvals workflow
├── dashboard-manager/  # Manager dashboard
├── goals/              # Goal management
├── team/               # Team members
├── settings/           # User settings
└── page.tsx            # Employee dashboard (home)

components/
├── layout/
│   ├── sidebar.tsx     # Navigation sidebar
│   ├── header.tsx      # Top header
│   └── app-layout.tsx  # Main layout wrapper
├── dashboard/
│   └── dashboard-card.tsx # Reusable card component
```

## Color System

The design uses a professional enterprise color scheme:
- **Primary**: Deep Blue (#1e3a5f) - Main brand color
- **Accent**: Indigo (#3b5bdb) - Secondary actions
- **Neutrals**: Slate grays for backgrounds and text
- **Status**: Green (success), Orange (pending), Red (error)

## Getting Started

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials

- **Employee**: demo@example.com / password
- **Manager**: manager@example.com / password
- **Admin**: admin@example.com / password

## Key Pages

### Employee Dashboard (`/`)
- Overview of active goals, completed goals, and performance
- Quick action buttons
- Important dates and deadlines

### Goals Management (`/goals`)
- Create and manage goals
- Track progress with visual indicators
- View key results
- Update progress and request feedback

### Manager Dashboard (`/dashboard-manager`)
- Team performance overview
- Goal status distribution
- Quick access to approvals

### Approvals Workflow (`/approvals`)
- Review pending submissions
- Approve or reject with feedback
- Status tracking

### Team Members (`/team`)
- View team performance metrics
- Monitor individual progress
- Track active goals

### Analytics (`/admin/analytics`)
- Performance trends over time
- Goal completion rates by quarter
- Department distribution
- Employee engagement metrics

### Employee Directory (`/admin/employees`)
- Search and filter employees
- View performance scores
- Manage employee profiles
- Bulk import capabilities

### Audit Logs (`/admin/logs`)
- Track all system activities
- Filter by status and action type
- Export audit trails

## Design Features

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Collapsible navigation on mobile

### Accessibility
- Semantic HTML
- Keyboard navigation support
- WCAG AA contrast compliance
- ARIA labels and roles

### Micro-interactions
- Smooth hover effects
- Button press animations
- Loading states
- Success/error feedback
- Progress bar animations

### Animation Library
- Fade-in animations
- Slide-in transitions
- Pulse effects for loading states
- 200-300ms transition durations

## Customization

### Modifying Colors

Edit design tokens in `app/globals.css`:
```css
:root {
  --primary: oklch(0.35 0.15 255);
  --accent: oklch(0.48 0.18 280);
  /* ... more tokens */
}
```

### Adding New Pages

1. Create a new directory under `app/`
2. Create `page.tsx` with your component
3. Wrap with `<AppLayout>` for consistent styling
4. Add navigation link in `components/layout/sidebar.tsx`

### Creating New Dashboard Cards

Import and use `DashboardCard` component:
```tsx
<DashboardCard
  title="Title"
  description="Optional description"
  action={{ label: "Action", onClick: () => {} }}
>
  {/* Card content */}
</DashboardCard>
```

## Future Enhancements

- Integration with backend API
- Real-time notifications
- Advanced filtering and search
- Export to PDF/Excel
- Email notifications
- Real-time collaboration
- Mobile app
- Dark mode toggle
- Multi-language support

## Performance Optimizations

- Next.js server-side rendering
- Code splitting and lazy loading
- Optimized images and assets
- CSS minification via Tailwind
- Efficient component structure

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - PrimeHR Enterprise

## Support

For support or questions, contact the development team.

---

Built with care using modern web technologies.
