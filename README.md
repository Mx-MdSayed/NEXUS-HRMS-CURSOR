# Nexus HRMS

Professional basic-to-mid-level Human Resource Management System — a modern React SPA for core HR operations.

## Module status

| Module | Area | Status |
| --- | --- | --- |
| 1 | Foundation & architecture | Complete |
| 2 | Design system & UI components | Complete |
| 3 | Authentication & RBAC | Complete |
| 4 | Dashboard | Complete |
| 5 | Employee management | Complete |
| 6 | Departments & designations | Complete |
| 7 | Attendance | Complete |
| 8 | Leave | Complete |
| 9 | Salary & compensation | Complete |
| 10 | Payroll | Complete |
| 11 | Payslips | Complete |
| 12 | Employee self-service (ESS) | Complete |
| 13 | Notifications & workflows | Complete |
| 14 | Reports & analytics | Complete |
| 15 | Users & permissions | Complete |
| 16 | Company settings | Complete |
| 17 | Integration, QA & security | Complete |
| 18 | Production UI/UX polish | Complete |

## Technology stack

- React 19, TypeScript, Vite 8
- React Router DOM, Tailwind CSS v4
- React Hook Form, TanStack React Table, Recharts
- Lucide React, date-fns, React Toastify

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server (port 5173) |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Oxlint |

## Project structure

```
src/
├── components/   # Shared UI, layouts, errors
├── constants/    # Nav, RBAC, design tokens
├── contexts/     # Auth, theme, sidebar
├── features/     # Domain modules
├── pages/        # Auth & error pages
├── routes/       # Routing & guards
├── services/     # Auth & shared services
└── utils/        # Formatting helpers
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full architecture notes.

## Environment variables

The SPA uses mock services in development. For production API integration, configure:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL (when wired) |
| `VITE_APP_ENV` | Environment label (`development` / `production`) |

Do not commit secrets, API keys, or production credentials.

## Development auth (mock only)

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `admin@example.com` | `Password123!` |
| HR Admin | `hr@example.com` | `Password123!` |
| Employee | `employee@example.com` | `Password123!` |

## Documentation

| Document | Description |
| --- | --- |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Frontend architecture, routing, RBAC |
| [USER_ROLES.md](docs/USER_ROLES.md) | Roles and permission model |
| [SETTINGS.md](docs/SETTINGS.md) | Company settings modules |
| [QA_REPORT.md](docs/QA_REPORT.md) | QA and security test results |
| [CODE_QUALITY_REPORT.md](docs/CODE_QUALITY_REPORT.md) | Code quality review |

## Deployment notes

1. Run `npm run build` — output in `dist/`
2. Serve `dist/` as static files (SPA fallback to `index.html`)
3. Replace mock auth/services with real APIs before production HR data
4. Enable HTTPS and secure session handling on the backend

## Known limitations (intentional)

Features deferred to future Advanced/Enterprise releases:

- Enterprise SSO (SAML, LDAP, SCIM)
- Advanced MFA / biometric hardware
- Multi-tenant SaaS billing
- External accounting / WhatsApp / SMS integrations
- Complex offline synchronization
- AI assistant, advanced tax engine, workflow designer

## UI preview

Internal design system showcase: `/ui-preview` (not in main navigation).
