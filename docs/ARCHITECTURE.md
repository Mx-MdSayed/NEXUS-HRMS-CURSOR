# Nexus HRMS — Architecture

## Overview

Nexus HRMS is a single-page application (SPA) built with React 19, TypeScript, and Vite. It targets a professional basic-to-mid-level HRMS scope: employees, attendance, leave, compensation, payroll, ESS, notifications, reports, access control, and company settings.

## Frontend stack

| Layer | Technology |
| --- | --- |
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Routing | React Router DOM 7 |
| Styling | Tailwind CSS v4 (`@theme` tokens + CSS variables) |
| Forms | React Hook Form |
| Tables | TanStack React Table |
| Charts | Recharts |
| Icons | Lucide React |
| Dates | date-fns |
| Feedback | React Toastify |

## Directory structure

```
src/
├── components/     # Shared UI, layouts, errors, forms, tables
├── constants/      # Navigation, RBAC, design tokens, route metadata
├── contexts/       # Auth, theme, sidebar
├── features/       # Domain modules (employees, payroll, settings, …)
├── hooks/          # Shared hooks (document title, route meta, media query)
├── pages/          # Top-level auth and error pages
├── routes/         # Route tree and guards
├── services/       # Auth and cross-cutting services
├── types/          # Shared TypeScript models
└── utils/          # Formatting, toast, cn helper
```

Each `features/<module>/` folder typically contains `pages/`, `components/`, `services/`, and `types/` for that domain.

## Routing

- **Public:** `/login`, `/forgot-password`, `/reset-password`
- **Protected:** wrapped in `ProtectedRoute` (session + force password change)
- **Permission-gated:** `PermissionRoute` checks `PERMISSIONS` via `AuthContext`
- **ESS portal:** `/employee/*` routes for employee self-service
- **Settings:** nested `/settings/*` with sidebar navigation
- **Errors:** `/403`, catch-all `404`

Route permissions are centralized in `src/constants/routePermissions.ts` (`ROUTE_PERMISSION_MAP`).

## Authentication

- Mock auth adapter in development (`mockAuthService` + `devAuthConfig`)
- Session stored in `localStorage` with TTL (remember-me extends lifetime)
- `AuthContext` exposes `user`, `login`, `logout`, `hasPermission`, `hasRole`
- Production deployments must replace the mock adapter with a real API-backed service

## RBAC & permissions

- Roles: `super_admin`, `hr_admin`, `hr_manager`, `manager`, `employee`
- Permissions are granular strings (e.g. `employee.view`, `payroll.finalize`)
- `ROLE_PERMISSIONS` maps roles to default permission sets
- UI hides unauthorized nav items and actions; **services enforce scope** (Module 17 hardening)
- `accessScopeService` resolves own-team vs organization-wide data access

## Settings

Company configuration is managed under `/settings` (Module 16): organization, HR policies, payroll, branding, security, workflows, and audit. Settings services persist to mock/local storage in development.

## Business workflows

Key flows (mock services, API-ready):

1. **Employee lifecycle** — create → assign dept/designation → documents → soft delete
2. **Attendance** — check-in/out, calendar, corrections, approvals
3. **Leave** — apply → approve/reject → balance sync → attendance integration
4. **Salary** — structures, components, assignments, revisions
5. **Payroll** — draft run → calculate → approve → finalize → payslip generation
6. **ESS** — employee portal for profile, leave, attendance, payslips, requests
7. **Notifications & workflows** — event-driven templates and approval queues
8. **Reports** — filtered exports with CSV sanitization

## Data relationships (conceptual)

- Employee ↔ Department, Designation, Salary assignment, Attendance, Leave
- Payroll run ↔ Employees ↔ Payslips
- User ↔ Role ↔ Permissions
- Company settings ↔ localization, schedules, policies

## Design system (Module 2 + 18)

- Tokens in `src/index.css` (`@theme` + `--hrms-*` variables)
- Typed exports in `src/constants/design.ts`
- Reusable primitives in `src/components/ui/`
- Dark mode via `ThemeContext` + `.dark` class on `<html>`
- Showcase at `/ui-preview` (internal)

## Future expansion

- Replace mock services with REST/GraphQL APIs
- Server-side session and token refresh
- Real-time notifications (WebSocket)
- Advanced enterprise features (SSO, multi-tenant, external integrations) — intentionally out of scope for this release
