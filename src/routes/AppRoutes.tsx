import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layouts'
import { PERMISSIONS } from '@/constants/permissions'
import { ROLES } from '@/constants/roles'
import {
  EmployeeCreatePage,
  EmployeeDirectoryGuard,
  EmployeeEditPage,
  EmployeeListPage,
  EmployeeProfilePage,
} from '@/features/employees'
import {
  DepartmentCreatePage,
  DepartmentDetailPage,
  DepartmentEditPage,
  DepartmentListPage,
  DesignationCreatePage,
  DesignationDetailPage,
  DesignationEditPage,
  DesignationListPage,
} from '@/features/organization'
import {
  AttendanceCalendarPage,
  AttendanceCorrectionsPage,
  AttendanceIndexPage,
  AttendanceSummaryPage,
  EmployeeAttendancePage,
  TodayAttendancePage,
} from '@/features/attendance'
import {
  LeaveApplyPage,
  LeaveBalancesPage,
  LeaveCalendarPage,
  LeaveDetailPage,
  LeaveEditPage,
  LeaveIndexPage,
  LeaveMyPage,
  LeaveRequestsPage,
  LeaveTypesPage,
} from '@/features/leave'
import {
  EmployeeSalaryPage,
  SalaryAssignmentFormPage,
  SalaryAssignmentsPage,
  SalaryComponentFormPage,
  SalaryComponentsPage,
  SalaryIndexPage,
  SalaryRevisionsPage,
  SalaryStructureDetailPage,
  SalaryStructureFormPage,
  SalaryStructuresPage,
} from '@/features/salary'
import {
  PayrollEmployeeDetailPage,
  PayrollEmployeesPage,
  PayrollIndexPage,
  PayrollRevisionsPage,
  PayrollRunDetailPage,
  PayrollRunEditPage,
  PayrollRunNewPage,
  PayrollRunsPage,
  PayrollSettingsPage,
} from '@/features/payroll'
import {
  EmployeePayslipsPage,
  PayslipDetailPage,
  PayslipPrintPage,
  PayslipSettingsPage,
  PayslipsPage,
} from '@/features/payslip'
import {
  AttendanceReportsPage,
  DepartmentReportsPage,
  DesignationReportsPage,
  EmployeeReportsPage,
  LeaveReportsPage,
  PayrollReportsPage,
  PayslipReportsPage,
  ReportsIndexPage,
  ReportsOverviewPage,
  SalaryReportsPage,
  WorkforceReportsPage,
} from '@/features/reports'
import {
  NotificationDetailPage,
  NotificationSettingsPage,
  NotificationTemplateFormPage,
  NotificationTemplatesPage,
  NotificationsPage,
} from '@/features/notifications'
import {
  WorkflowRequestDetailPage,
  WorkflowRequestsPage,
  WorkflowsDashboardPage,
} from '@/features/workflows'
import {
  EssAttendanceCalendarPage,
  EssAttendancePage,
  EssDashboardPage,
  EssDocumentsPage,
  EssLeaveApplyPage,
  EssLeaveDetailPage,
  EssLeavePage,
  EssNotificationsPage,
  EssPayslipDetailPage,
  EssPayslipsPage,
  EssProfilePage,
  EssRequestDetailPage,
  EssRequestsPage,
  EssSalaryPage,
  EssSettingsPage,
} from '@/features/ess'
import { AccessDeniedPage } from '@/pages/AccessDeniedPage'
import {
  LoginActivityPage,
  PermissionMatrixPage,
  PermissionsPage,
  RoleCreatePage,
  RoleDetailPage,
  RoleEditPage,
  RoleListPage,
  SecurityDashboardPage,
  SessionsPage,
  UserCreatePage,
  UserDetailPage,
  UserEditPage,
  UserListPage,
} from '@/features/access-control'
import { ChangePasswordPage } from '@/pages/ChangePasswordPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProfilePage } from '@/pages/ProfilePage'
import {
  AttendanceSettingsPage,
  BrandingSettingsPage,
  CompanySettingsPage,
  HolidaysSettingsPage,
  LeavePoliciesSettingsPage,
  LocalizationSettingsPage,
  LocationsSettingsPage,
  NotificationSettingsPage as SystemNotificationSettingsPage,
  OrganizationSettingsPage,
  PayrollSettingsConfigPage,
  PayslipSettingsConfigPage,
  SettingsAuditPage,
  SettingsDashboardPage,
  SettingsDepartmentsPage,
  SettingsDesignationsPage,
  SettingsLayout,
  WorkSchedulesSettingsPage,
  WorkflowSettingsPage,
} from '@/features/settings'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { UiPreviewPage } from '@/pages/UiPreviewPage'
import { GuestRoute } from '@/routes/GuestRoute'
import { PermissionRoute } from '@/routes/PermissionRoute'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <GuestRoute>
            <ResetPasswordPage />
          </GuestRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <PermissionRoute permission={PERMISSIONS.DASHBOARD_VIEW}>
              <DashboardPage />
            </PermissionRoute>
          }
        />
        <Route path="employee" element={<Navigate to="/employee/dashboard" replace />} />
        <Route
          path="employee/dashboard"
          element={
            <PermissionRoute permission={PERMISSIONS.ESS_VIEW}>
              <EssDashboardPage />
            </PermissionRoute>
          }
        />
        <Route
          path="employee/profile"
          element={
            <PermissionRoute permission={PERMISSIONS.ESS_VIEW}>
              <EssProfilePage />
            </PermissionRoute>
          }
        />
        <Route
          path="employee/attendance"
          element={
            <PermissionRoute permission={PERMISSIONS.ESS_VIEW}>
              <EssAttendancePage />
            </PermissionRoute>
          }
        />
        <Route
          path="employee/attendance/calendar"
          element={
            <PermissionRoute permission={PERMISSIONS.ESS_VIEW}>
              <EssAttendanceCalendarPage />
            </PermissionRoute>
          }
        />
        <Route
          path="employee/leave"
          element={
            <PermissionRoute permission={PERMISSIONS.ESS_VIEW}>
              <EssLeavePage />
            </PermissionRoute>
          }
        />
        <Route
          path="employee/leave/apply"
          element={
            <PermissionRoute permission={PERMISSIONS.ESS_VIEW}>
              <EssLeaveApplyPage />
            </PermissionRoute>
          }
        />
        <Route
          path="employee/leave/:id"
          element={
            <PermissionRoute permission={PERMISSIONS.ESS_VIEW}>
              <EssLeaveDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="employee/salary"
          element={
            <PermissionRoute permission={PERMISSIONS.ESS_VIEW}>
              <EssSalaryPage />
            </PermissionRoute>
          }
        />
        <Route
          path="employee/payslips"
          element={
            <PermissionRoute permission={PERMISSIONS.ESS_VIEW}>
              <EssPayslipsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="employee/payslips/:id/print"
          element={
            <PermissionRoute permission={PERMISSIONS.ESS_VIEW}>
              <PayslipPrintPage />
            </PermissionRoute>
          }
        />
        <Route
          path="employee/payslips/:id"
          element={
            <PermissionRoute permission={PERMISSIONS.ESS_VIEW}>
              <EssPayslipDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="employee/documents"
          element={
            <PermissionRoute permission={PERMISSIONS.ESS_VIEW}>
              <EssDocumentsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="employee/requests"
          element={
            <PermissionRoute permission={PERMISSIONS.ESS_VIEW}>
              <EssRequestsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="employee/requests/:id"
          element={
            <PermissionRoute permission={PERMISSIONS.ESS_VIEW}>
              <EssRequestDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="employee/notifications"
          element={
            <PermissionRoute permission={PERMISSIONS.ESS_VIEW}>
              <EssNotificationsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="employee/settings"
          element={
            <PermissionRoute permission={PERMISSIONS.ESS_VIEW}>
              <EssSettingsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="employees"
          element={
            <EmployeeDirectoryGuard>
              <EmployeeListPage />
            </EmployeeDirectoryGuard>
          }
        />
        <Route
          path="employees/new"
          element={
            <PermissionRoute permission={PERMISSIONS.EMPLOYEE_CREATE}>
              <EmployeeCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="employees/:id"
          element={
            <PermissionRoute permission={PERMISSIONS.EMPLOYEE_VIEW}>
              <EmployeeProfilePage />
            </PermissionRoute>
          }
        />
        <Route
          path="employees/:id/edit"
          element={
            <PermissionRoute permission={PERMISSIONS.EMPLOYEE_EDIT}>
              <EmployeeEditPage />
            </PermissionRoute>
          }
        />
        <Route
          path="departments"
          element={
            <PermissionRoute permission={PERMISSIONS.DEPARTMENT_VIEW}>
              <DepartmentListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="departments/new"
          element={
            <PermissionRoute permission={PERMISSIONS.DEPARTMENT_CREATE}>
              <DepartmentCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="departments/:id"
          element={
            <PermissionRoute permission={PERMISSIONS.DEPARTMENT_VIEW}>
              <DepartmentDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="departments/:id/edit"
          element={
            <PermissionRoute permission={PERMISSIONS.DEPARTMENT_EDIT}>
              <DepartmentEditPage />
            </PermissionRoute>
          }
        />
        <Route
          path="designations"
          element={
            <PermissionRoute permission={PERMISSIONS.DESIGNATION_VIEW}>
              <DesignationListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="designations/new"
          element={
            <PermissionRoute permission={PERMISSIONS.DESIGNATION_CREATE}>
              <DesignationCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="designations/:id"
          element={
            <PermissionRoute permission={PERMISSIONS.DESIGNATION_VIEW}>
              <DesignationDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="designations/:id/edit"
          element={
            <PermissionRoute permission={PERMISSIONS.DESIGNATION_EDIT}>
              <DesignationEditPage />
            </PermissionRoute>
          }
        />
        <Route
          path="attendance"
          element={
            <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
              <AttendanceIndexPage />
            </PermissionRoute>
          }
        />
        <Route
          path="attendance/today"
          element={
            <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
              <TodayAttendancePage />
            </PermissionRoute>
          }
        />
        <Route
          path="attendance/calendar"
          element={
            <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
              <AttendanceCalendarPage />
            </PermissionRoute>
          }
        />
        <Route
          path="attendance/summary"
          element={
            <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
              <AttendanceSummaryPage />
            </PermissionRoute>
          }
        />
        <Route
          path="attendance/corrections"
          element={
            <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
              <AttendanceCorrectionsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="attendance/:employeeId"
          element={
            <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
              <EmployeeAttendancePage />
            </PermissionRoute>
          }
        />
        <Route
          path="leave"
          element={
            <PermissionRoute permission={PERMISSIONS.LEAVE_VIEW}>
              <LeaveIndexPage />
            </PermissionRoute>
          }
        />
        <Route
          path="leave/apply"
          element={
            <PermissionRoute permission={[PERMISSIONS.LEAVE_APPLY, PERMISSIONS.LEAVE_CREATE]}>
              <LeaveApplyPage />
            </PermissionRoute>
          }
        />
        <Route
          path="leave/my"
          element={
            <PermissionRoute permission={PERMISSIONS.LEAVE_VIEW}>
              <LeaveMyPage />
            </PermissionRoute>
          }
        />
        <Route
          path="leave/calendar"
          element={
            <PermissionRoute permission={PERMISSIONS.LEAVE_VIEW}>
              <LeaveCalendarPage />
            </PermissionRoute>
          }
        />
        <Route
          path="leave/requests"
          element={
            <PermissionRoute permission={PERMISSIONS.LEAVE_VIEW}>
              <LeaveRequestsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="leave/types"
          element={
            <PermissionRoute permission={[PERMISSIONS.LEAVE_TYPE_MANAGE, PERMISSIONS.LEAVE_MANAGE]}>
              <LeaveTypesPage />
            </PermissionRoute>
          }
        />
        <Route
          path="leave/balances"
          element={
            <PermissionRoute
              permission={[PERMISSIONS.LEAVE_BALANCE_MANAGE, PERMISSIONS.LEAVE_MANAGE]}
            >
              <LeaveBalancesPage />
            </PermissionRoute>
          }
        />
        <Route
          path="leave/:id/edit"
          element={
            <PermissionRoute permission={PERMISSIONS.LEAVE_EDIT}>
              <LeaveEditPage />
            </PermissionRoute>
          }
        />
        <Route
          path="leave/:id"
          element={
            <PermissionRoute permission={PERMISSIONS.LEAVE_VIEW}>
              <LeaveDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="salary"
          element={
            <PermissionRoute permission={PERMISSIONS.SALARY_VIEW}>
              <SalaryIndexPage />
            </PermissionRoute>
          }
        />
        <Route
          path="salary/components"
          element={
            <PermissionRoute
              permission={[PERMISSIONS.SALARY_COMPONENT_MANAGE, PERMISSIONS.SALARY_MANAGE]}
            >
              <SalaryComponentsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="salary/components/new"
          element={
            <PermissionRoute
              permission={[PERMISSIONS.SALARY_COMPONENT_MANAGE, PERMISSIONS.SALARY_MANAGE]}
            >
              <SalaryComponentFormPage />
            </PermissionRoute>
          }
        />
        <Route
          path="salary/components/:id/edit"
          element={
            <PermissionRoute
              permission={[PERMISSIONS.SALARY_COMPONENT_MANAGE, PERMISSIONS.SALARY_MANAGE]}
            >
              <SalaryComponentFormPage />
            </PermissionRoute>
          }
        />
        <Route
          path="salary/structures"
          element={
            <PermissionRoute
              permission={[PERMISSIONS.SALARY_MANAGE, PERMISSIONS.SALARY_CREATE, PERMISSIONS.SALARY_EDIT]}
            >
              <SalaryStructuresPage />
            </PermissionRoute>
          }
        />
        <Route
          path="salary/structures/new"
          element={
            <PermissionRoute permission={[PERMISSIONS.SALARY_CREATE, PERMISSIONS.SALARY_MANAGE]}>
              <SalaryStructureFormPage />
            </PermissionRoute>
          }
        />
        <Route
          path="salary/structures/:id/edit"
          element={
            <PermissionRoute permission={[PERMISSIONS.SALARY_EDIT, PERMISSIONS.SALARY_MANAGE]}>
              <SalaryStructureFormPage />
            </PermissionRoute>
          }
        />
        <Route
          path="salary/structures/:id"
          element={
            <PermissionRoute
              permission={[PERMISSIONS.SALARY_MANAGE, PERMISSIONS.SALARY_CREATE, PERMISSIONS.SALARY_EDIT]}
            >
              <SalaryStructureDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="salary/assignments"
          element={
            <PermissionRoute
              permission={[PERMISSIONS.SALARY_MANAGE, PERMISSIONS.SALARY_ASSIGN]}
            >
              <SalaryAssignmentsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="salary/assignments/new"
          element={
            <PermissionRoute permission={[PERMISSIONS.SALARY_ASSIGN, PERMISSIONS.SALARY_MANAGE]}>
              <SalaryAssignmentFormPage />
            </PermissionRoute>
          }
        />
        <Route
          path="salary/revisions"
          element={
            <PermissionRoute
              permission={[PERMISSIONS.SALARY_MANAGE, PERMISSIONS.SALARY_REVISE, PERMISSIONS.SALARY_ASSIGN]}
            >
              <SalaryRevisionsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="salary/:employeeId"
          element={
            <PermissionRoute permission={PERMISSIONS.SALARY_VIEW}>
              <EmployeeSalaryPage />
            </PermissionRoute>
          }
        />
        <Route
          path="payroll"
          element={
            <PermissionRoute permission={PERMISSIONS.PAYROLL_VIEW}>
              <PayrollIndexPage />
            </PermissionRoute>
          }
        />
        <Route
          path="payroll/runs"
          element={
            <PermissionRoute permission={PERMISSIONS.PAYROLL_VIEW}>
              <PayrollRunsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="payroll/runs/new"
          element={
            <PermissionRoute
              permission={[PERMISSIONS.PAYROLL_CREATE, PERMISSIONS.PAYROLL_MANAGE]}
            >
              <PayrollRunNewPage />
            </PermissionRoute>
          }
        />
        <Route
          path="payroll/runs/:id"
          element={
            <PermissionRoute permission={PERMISSIONS.PAYROLL_VIEW}>
              <PayrollRunDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="payroll/runs/:id/edit"
          element={
            <PermissionRoute permission={[PERMISSIONS.PAYROLL_EDIT, PERMISSIONS.PAYROLL_MANAGE]}>
              <PayrollRunEditPage />
            </PermissionRoute>
          }
        />
        <Route
          path="payroll/employees"
          element={
            <PermissionRoute
              permission={[PERMISSIONS.PAYROLL_VIEW, PERMISSIONS.PAYROLL_EMPLOYEE_VIEW]}
            >
              <PayrollEmployeesPage />
            </PermissionRoute>
          }
        />
        <Route
          path="payroll/employees/:employeeId"
          element={
            <PermissionRoute
              permission={[PERMISSIONS.PAYROLL_VIEW, PERMISSIONS.PAYROLL_EMPLOYEE_VIEW]}
            >
              <PayrollEmployeeDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="payroll/revisions"
          element={
            <PermissionRoute permission={PERMISSIONS.PAYROLL_VIEW}>
              <PayrollRevisionsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="payroll/settings"
          element={
            <PermissionRoute
              permission={[PERMISSIONS.PAYROLL_SETTINGS_MANAGE, PERMISSIONS.PAYROLL_MANAGE]}
            >
              <PayrollSettingsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="payslips"
          element={
            <PermissionRoute permission={PERMISSIONS.PAYSLIP_VIEW}>
              <PayslipsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="payslips/settings"
          element={
            <PermissionRoute permission={PERMISSIONS.PAYSLIP_MANAGE}>
              <PayslipSettingsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="payslips/employee/:employeeId"
          element={
            <PermissionRoute permission={PERMISSIONS.PAYSLIP_VIEW}>
              <EmployeePayslipsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="payslips/:id/print"
          element={
            <PermissionRoute permission={[PERMISSIONS.PAYSLIP_VIEW, PERMISSIONS.PAYSLIP_PRINT]}>
              <PayslipPrintPage />
            </PermissionRoute>
          }
        />
        <Route
          path="payslips/:id"
          element={
            <PermissionRoute permission={PERMISSIONS.PAYSLIP_VIEW}>
              <PayslipDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="reports"
          element={
            <PermissionRoute permission={PERMISSIONS.REPORTS_VIEW}>
              <ReportsIndexPage />
            </PermissionRoute>
          }
        />
        <Route
          path="reports/overview"
          element={
            <PermissionRoute permission={PERMISSIONS.REPORTS_VIEW}>
              <ReportsOverviewPage />
            </PermissionRoute>
          }
        />
        <Route
          path="reports/employees"
          element={
            <PermissionRoute permission={PERMISSIONS.REPORT_EMPLOYEE}>
              <EmployeeReportsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="reports/attendance"
          element={
            <PermissionRoute permission={PERMISSIONS.REPORT_ATTENDANCE}>
              <AttendanceReportsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="reports/leave"
          element={
            <PermissionRoute permission={PERMISSIONS.REPORT_LEAVE}>
              <LeaveReportsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="reports/salary"
          element={
            <PermissionRoute permission={PERMISSIONS.REPORT_SALARY}>
              <SalaryReportsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="reports/payroll"
          element={
            <PermissionRoute permission={PERMISSIONS.REPORT_PAYROLL}>
              <PayrollReportsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="reports/payslips"
          element={
            <PermissionRoute permission={PERMISSIONS.REPORT_PAYSLIP}>
              <PayslipReportsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="reports/departments"
          element={
            <PermissionRoute permission={PERMISSIONS.REPORT_DEPARTMENT}>
              <DepartmentReportsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="reports/designations"
          element={
            <PermissionRoute permission={PERMISSIONS.REPORT_DEPARTMENT}>
              <DesignationReportsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="reports/workforce"
          element={
            <PermissionRoute permission={PERMISSIONS.REPORT_WORKFORCE}>
              <WorkforceReportsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <PermissionRoute permission={PERMISSIONS.NOTIFICATION_VIEW}>
              <NotificationsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="notifications/settings"
          element={
            <PermissionRoute permission={PERMISSIONS.NOTIFICATION_VIEW}>
              <NotificationSettingsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="notifications/templates"
          element={
            <PermissionRoute
              permission={[PERMISSIONS.NOTIFICATION_TEMPLATE_MANAGE, PERMISSIONS.NOTIFICATION_MANAGE]}
            >
              <NotificationTemplatesPage />
            </PermissionRoute>
          }
        />
        <Route
          path="notifications/templates/new"
          element={
            <PermissionRoute
              permission={[PERMISSIONS.NOTIFICATION_TEMPLATE_MANAGE, PERMISSIONS.NOTIFICATION_MANAGE]}
            >
              <NotificationTemplateFormPage />
            </PermissionRoute>
          }
        />
        <Route
          path="notifications/templates/:id/edit"
          element={
            <PermissionRoute
              permission={[PERMISSIONS.NOTIFICATION_TEMPLATE_MANAGE, PERMISSIONS.NOTIFICATION_MANAGE]}
            >
              <NotificationTemplateFormPage />
            </PermissionRoute>
          }
        />
        <Route
          path="notifications/:id"
          element={
            <PermissionRoute permission={PERMISSIONS.NOTIFICATION_VIEW}>
              <NotificationDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="workflows"
          element={
            <PermissionRoute permission={PERMISSIONS.WORKFLOW_VIEW}>
              <WorkflowsDashboardPage />
            </PermissionRoute>
          }
        />
        <Route
          path="workflows/requests"
          element={
            <PermissionRoute permission={PERMISSIONS.WORKFLOW_VIEW}>
              <WorkflowRequestsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="workflows/requests/:id"
          element={
            <PermissionRoute permission={PERMISSIONS.WORKFLOW_VIEW}>
              <WorkflowRequestDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="users"
          element={
            <PermissionRoute permission={PERMISSIONS.USER_VIEW}>
              <UserListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="users/new"
          element={
            <PermissionRoute permission={[PERMISSIONS.USER_CREATE, PERMISSIONS.USER_MANAGE]}>
              <UserCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="users/:id"
          element={
            <PermissionRoute permission={PERMISSIONS.USER_VIEW}>
              <UserDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="users/:id/edit"
          element={
            <PermissionRoute permission={[PERMISSIONS.USER_EDIT, PERMISSIONS.USER_MANAGE]}>
              <UserEditPage />
            </PermissionRoute>
          }
        />
        <Route
          path="roles"
          element={
            <PermissionRoute permission={PERMISSIONS.ROLE_VIEW}>
              <RoleListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="roles/new"
          element={
            <PermissionRoute permission={[PERMISSIONS.ROLE_CREATE, PERMISSIONS.ROLE_MANAGE]}>
              <RoleCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="roles/:id"
          element={
            <PermissionRoute permission={PERMISSIONS.ROLE_VIEW}>
              <RoleDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="roles/:id/edit"
          element={
            <PermissionRoute permission={[PERMISSIONS.ROLE_EDIT, PERMISSIONS.ROLE_MANAGE]}>
              <RoleEditPage />
            </PermissionRoute>
          }
        />
        <Route
          path="permissions"
          element={
            <PermissionRoute permission={PERMISSIONS.PERMISSION_VIEW}>
              <PermissionsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="permissions/matrix"
          element={
            <PermissionRoute permission={[PERMISSIONS.PERMISSION_MANAGE, PERMISSIONS.ROLE_MANAGE]}>
              <PermissionMatrixPage />
            </PermissionRoute>
          }
        />
        <Route
          path="security"
          element={
            <PermissionRoute permission={PERMISSIONS.SECURITY_VIEW}>
              <SecurityDashboardPage />
            </PermissionRoute>
          }
        />
        <Route
          path="security/login-activity"
          element={
            <PermissionRoute permission={PERMISSIONS.SECURITY_VIEW}>
              <LoginActivityPage />
            </PermissionRoute>
          }
        />
        <Route
          path="security/sessions"
          element={
            <PermissionRoute permission={PERMISSIONS.SECURITY_VIEW}>
              <SessionsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="settings"
          element={
            <PermissionRoute permission={PERMISSIONS.SETTINGS_VIEW}>
              <SettingsLayout />
            </PermissionRoute>
          }
        >
          <Route index element={<SettingsDashboardPage />} />
          <Route
            path="company"
            element={
              <PermissionRoute permission={[PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.COMPANY_MANAGE]}>
                <CompanySettingsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="organization"
            element={
              <PermissionRoute
                permission={[PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.ORGANIZATION_MANAGE]}
              >
                <OrganizationSettingsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="departments"
            element={
              <PermissionRoute
                permission={[PERMISSIONS.DEPARTMENT_VIEW, PERMISSIONS.DEPARTMENT_MANAGE]}
              >
                <SettingsDepartmentsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="designations"
            element={
              <PermissionRoute
                permission={[PERMISSIONS.DESIGNATION_VIEW, PERMISSIONS.DESIGNATION_MANAGE]}
              >
                <SettingsDesignationsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="locations"
            element={
              <PermissionRoute permission={[PERMISSIONS.LOCATION_MANAGE, PERMISSIONS.SETTINGS_VIEW]}>
                <LocationsSettingsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="work-schedules"
            element={
              <PermissionRoute permission={[PERMISSIONS.SCHEDULE_MANAGE, PERMISSIONS.SETTINGS_VIEW]}>
                <WorkSchedulesSettingsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="holidays"
            element={
              <PermissionRoute permission={[PERMISSIONS.HOLIDAY_MANAGE, PERMISSIONS.SETTINGS_VIEW]}>
                <HolidaysSettingsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="leave-policies"
            element={
              <PermissionRoute
                permission={[PERMISSIONS.LEAVE_POLICY_MANAGE, PERMISSIONS.SETTINGS_VIEW]}
              >
                <LeavePoliciesSettingsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="attendance"
            element={
              <PermissionRoute
                permission={[PERMISSIONS.ATTENDANCE_SETTINGS_MANAGE, PERMISSIONS.SETTINGS_VIEW]}
              >
                <AttendanceSettingsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="payroll"
            element={
              <PermissionRoute
                permission={[
                  PERMISSIONS.PAYROLL_SETTINGS_MANAGE_GLOBAL,
                  PERMISSIONS.PAYROLL_SETTINGS_MANAGE,
                  PERMISSIONS.SETTINGS_VIEW,
                ]}
              >
                <PayrollSettingsConfigPage />
              </PermissionRoute>
            }
          />
          <Route
            path="payslip"
            element={
              <PermissionRoute
                permission={[PERMISSIONS.PAYSLIP_SETTINGS_MANAGE, PERMISSIONS.SETTINGS_VIEW]}
              >
                <PayslipSettingsConfigPage />
              </PermissionRoute>
            }
          />
          <Route
            path="localization"
            element={
              <PermissionRoute
                permission={[PERMISSIONS.LOCALIZATION_MANAGE, PERMISSIONS.SETTINGS_VIEW]}
              >
                <LocalizationSettingsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="notifications"
            element={
              <PermissionRoute
                permission={[
                  PERMISSIONS.NOTIFICATION_SETTINGS_MANAGE_GLOBAL,
                  PERMISSIONS.NOTIFICATION_SETTINGS_MANAGE,
                  PERMISSIONS.SETTINGS_VIEW,
                ]}
              >
                <SystemNotificationSettingsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="workflows"
            element={
              <PermissionRoute
                permission={[PERMISSIONS.WORKFLOW_SETTINGS_MANAGE, PERMISSIONS.SETTINGS_VIEW]}
              >
                <WorkflowSettingsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="branding"
            element={
              <PermissionRoute permission={[PERMISSIONS.BRANDING_MANAGE, PERMISSIONS.SETTINGS_VIEW]}>
                <BrandingSettingsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="audit"
            element={
              <PermissionRoute permission={[PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SECURITY_VIEW]}>
                <SettingsAuditPage />
              </PermissionRoute>
            }
          />
        </Route>
        <Route
          path="profile"
          element={
            <PermissionRoute permission={PERMISSIONS.PROFILE_VIEW}>
              <ProfilePage />
            </PermissionRoute>
          }
        />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route
          path="ui-preview"
          element={
            <PermissionRoute role={ROLES.SUPER_ADMIN}>
              <UiPreviewPage />
            </PermissionRoute>
          }
        />
        <Route path="403" element={<AccessDeniedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
