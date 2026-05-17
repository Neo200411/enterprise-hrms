# PrimeHR - Enterprise HRMS Portal

## Overview

PrimeHR is a modern Human Resource Management System (HRMS) built for managing employee goals, approvals, quarterly check-ins, and performance tracking.

The portal supports role-based access for Employees, Managers, and Admins using secure authentication and workflow management.

---

## Features

### Authentication & Role Management

* Secure login using Supabase Authentication
* Role-based dashboards for:
  * Employee
  * Manager
  * Admin

### Employee Module

* Create and manage quarterly goals
* Save goals as draft
* Submit goals for manager approval
* Quarterly performance check-ins
* Progress tracking

### Manager Module

* Review employee goals
* Approve or reject submissions
* Add manager remarks
* Edit targets and weightage before approval

### Admin Module

* View organization analytics
* Track approvals and submissions
* Export reports in CSV format

---

## Tech Stack

### Frontend

* Next.js (App Router)
* React
* TypeScript
* Tailwind CSS
* Lucide React (Icons)
* Recharts (Data Visualization)

### Backend & Database

* Supabase (Auth & PostgreSQL)

### Validation & Forms

* React Hook Form
* Zod

---

## Database Tables

* `users`
* `goals`
* `goal_submissions`
* `approvals`
* `goal_checkins`

---

## Workflow

1. **Employee** → Create Goals → Submit for Approval
2. **Manager** → Review Goals → Approve/Reject/Rework (with comments & target/weightage overrides)
3. **Employee** → Submit Quarterly Check-ins (actual achievements, progress status)
4. **Manager** → Compare Planned vs Actual Check-in performance
5. **Admin** → Monitor Live Analytics, Recent activity, & Export detailed reports

---

## Installation

### Clone Repository

```bash
git clone https://github.com/Neo200411/atomberg_comp.git
cd atomberg_comp
```

### Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### Setup Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Run Development Server

```bash
npm run dev
```

---

## Demo Credentials

### Employee
- **Email:** employee@test.com
- **Password:** Test@123

### Manager
- **Email:** manager@test.com
- **Password:** Test@123

### Admin
- **Email:** admin@test.com
- **Password:** Test@123

---

## Future Improvements

* Email & Slack notifications for approval transitions
* AI-based employee performance predictions
* Attendance tracking and leave management
* Payroll integration
* Dynamic responsive chart themes

---

## Contributors

* Neo Mishra
