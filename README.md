# PrimeHR - Enterprise HRMS Portal

## Overview

PrimeHR is a modern Human Resource Management System (HRMS) built for managing employee goals, approvals, quarterly check-ins, and performance tracking.

The portal supports role-based access for Employees, Managers, and Admins using secure authentication and workflow management.

---

## Features

### Authentication & Role Management

* Secure JWT Authentication
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

* Express.js Backend
* PostgreSQL Database (Supabase)
* JWT Authentication

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

## Architecture

1. Next.js App Router (Frontend)
2. Express.js (Backend REST API)
3. PostgreSQL (Database)
4. JWT Authentication & RBAC

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
git clone https://github.com/Neo200411/enterprise-hrms.git
cd enterprise-hrms
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
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

And in the `backend/` directory, create a `.env`:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
PORT=5001
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
