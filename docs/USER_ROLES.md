# Nexus HRMS — User Roles

## Role model

Roles define default permission bundles. Individual users may receive custom permission overrides via the Users & Permissions module.

| Role | Code | Typical persona |
| --- | --- | --- |
| Super Admin | `super_admin` | Platform / IT owner |
| HR Admin | `hr_admin` | HR operations lead |
| HR Manager | `hr_manager` | HR team manager |
| Manager | `manager` | Line manager |
| Employee | `employee` | Individual contributor |

## Super Admin

- **Responsibilities:** Full system configuration, security, users, roles, all HR modules
- **Access:** All permissions; organization-wide data scope
- **Portal:** Admin layout (`/dashboard`, full sidebar)

## HR Admin

- **Responsibilities:** Day-to-day HR — employees, attendance, leave, payroll, reports, most settings
- **Access:** Broad HR and payroll permissions; typically no destructive security actions reserved for super admin
- **Portal:** Admin layout

## HR Manager

- **Responsibilities:** Team HR operations, approvals, reporting
- **Access:** HR modules with management permissions; limited settings
- **Portal:** Admin layout

## Manager

- **Responsibilities:** Team attendance/leave approvals, team visibility
- **Access:** Scoped to team where enforced by services; no payroll finalize
- **Portal:** Admin layout (subset of nav items)

## Employee

- **Responsibilities:** Self-service — profile, attendance, leave, payslips, documents, requests
- **Access:** ESS permissions; own data only (enforced in services)
- **Portal:** Employee self-service (`/employee/dashboard`)

## Permission system

- Permissions are string constants in `src/constants/permissions.ts`
- Checked via `hasPermission`, `hasAnyPermission`, `hasAllPermissions` in `AuthContext`
- Routes mapped in `ROUTE_PERMISSION_MAP`
- Sensitive actions (finalize payroll, grant payroll permission, deactivate user) require explicit permissions and often confirmation dialogs

## Data scope

- **Employee:** own records only
- **Manager:** team scope (where implemented)
- **HR / Admin:** organization-wide (subject to permission)

Service-layer checks in Module 17 prevent IDOR via direct URLs or API-style service calls.

## Development accounts (mock only)

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `admin@example.com` | `Password123!` |
| HR Admin | `hr@example.com` | `Password123!` |
| Employee | `employee@example.com` | `Password123!` |

Never use these credentials in production.
