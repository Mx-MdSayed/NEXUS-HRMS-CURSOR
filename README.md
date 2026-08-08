# Nexus HRMS

Professional Basic-to-Mid-Level Human Resource Management System.

## Module status

- **Module 1** — Foundation & architecture (complete)
- **Module 2** — Design system & reusable UI components (complete)
- **Module 3** — Authentication & RBAC (complete)
- **Module 4** — Dashboard & core overview (complete)
- **Module 5** — Employee management (complete)
- **Module 6** — Department & designation management (complete)
- **Module 7** — Attendance management (complete)
- **Module 8** — Leave management (complete)
- **Module 9** — Salary structure & compensation (complete)
- **Module 10** — Payroll management (complete)
- **Module 11** — Payslip & salary document management (complete)

## Getting started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start development server
- `npm run build` — typecheck and production build
- `npm run preview` — preview production build
- `npm run lint` — run oxlint

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
