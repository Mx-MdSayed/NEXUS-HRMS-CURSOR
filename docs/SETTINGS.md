# Nexus HRMS — Settings

Settings are available at `/settings` (admin) and `/employee/settings` (ESS). Access requires `settings.view` or ESS permissions.

## Navigation structure

| Section | Path prefix | Purpose |
| --- | --- | --- |
| General | `/settings` | Dashboard overview, quick links |
| Company | `/settings/company` | Legal entity, contact, registration |
| Organization | `/settings/organization` | Structure, locations, hierarchy |
| HR | `/settings/departments`, designations | Org units tied to Module 5/6 |
| Attendance | `/settings/attendance` | Schedules, holidays, week-off rules |
| Leave | `/settings/leave` | Policies, types, accrual rules |
| Payroll | `/settings/payroll` | Cycles, components, tax placeholders |
| Payslip | `/settings/payslip` | Layout, labels, display options |
| Localization | `/settings/localization` | Date format, currency, locale |
| Notifications | `/settings/notifications` | Channels, templates (admin) |
| Workflows | `/settings/workflows` | Approval chains (Module 13) |
| Branding | `/settings/branding` | Logo, colors, document header |
| Security | `/settings/security` | Password policy, session, audit |

## Company

- Company name, address, registration IDs
- Default currency and fiscal context (feeds `companyDefaults` in config)

## Organization

- Departments and designations (linked to employee records)
- Locations and work sites

## Attendance

- Work schedules, grace periods, overtime rules
- Holiday calendar integration

## Leave

- Leave types, balances, approval rules
- Policy changes do not rewrite historical approved leave

## Payroll

- Pay periods, calculation settings
- Integration with salary structures (Module 9)

## Payslip

- Template fields, company header on documents
- Print-friendly layout (see print CSS)

## Localization

- `dateFormat`, `currencyCode`, `currencyLocale`
- Used by `formatDate`, `formatCurrency`, `formatNumber`

## Notifications

- Template management, event triggers
- Non-blocking delivery (failures logged, not shown to end users)

## Workflows

- Request types and approval steps
- Used by leave, attendance corrections, profile changes, payroll

## Branding

- Theme accents (within design token system)
- Logo URL for payslips and login (when configured)

## Security

- Password requirements (`MIN_PASSWORD_LENGTH` and policy UI)
- Session duration, login activity audit
- Complements `/security` module for live monitoring

## Audit

- Settings change log at `/settings/audit`
- Tracks who changed configuration and when (mock in development)
