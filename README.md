# Nexus HRMS

Professional Basic-to-Mid-Level Human Resource Management System.

## Module status

- **Module 1** — Foundation & architecture (complete)
- **Module 2** — Design system & reusable UI components (complete)
- **Module 3** — Authentication & RBAC (complete)
- **Module 4** — Dashboard & core overview (complete)

## Getting started

```bash
npm install
npm run dev
```

## Development auth accounts (mock only)

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `admin@example.com` | `Password123!` |
| HR Admin | `hr@example.com` | `Password123!` |
| Employee | `employee@example.com` | `Password123!` |

These credentials exist only in the development mock auth adapter and must never be used in production.

## Auth routes

- `/login`
- `/forgot-password`
- `/reset-password`
- `/change-password`

## Dashboard

Role-aware dashboard at `/dashboard`:

- Admin / HR Admin → organization overview (KPIs, charts, leave, payroll summary)
- Employee → personal HR overview only

Dashboard data currently comes from a mock `dashboardService` and is ready to swap for real APIs later.

## UI Preview

Internal design system showcase (not in main navigation): `/ui-preview`
