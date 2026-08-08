import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layouts'
import { PERMISSIONS } from '@/constants/permissions'
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
import { ChangePasswordPage } from '@/pages/ChangePasswordPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { ProfilePage } from '@/pages/ProfilePage'
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
            <PermissionRoute permission={PERMISSIONS.SALARY_VIEW}>
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
            <PermissionRoute permission={PERMISSIONS.SALARY_VIEW}>
              <SalaryStructureDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="salary/assignments"
          element={
            <PermissionRoute permission={PERMISSIONS.SALARY_VIEW}>
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
            <PermissionRoute permission={PERMISSIONS.SALARY_VIEW}>
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
              <PlaceholderPage
                title="Reports"
                moduleLabel="Later module"
                description="HR analytics and exportable reports will be implemented in a later module."
              />
            </PermissionRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <PermissionRoute permission={PERMISSIONS.NOTIFICATION_VIEW}>
              <PlaceholderPage
                title="Notifications"
                moduleLabel="Later module"
                description="In-app notifications and alert preferences will be implemented later."
              />
            </PermissionRoute>
          }
        />
        <Route
          path="users"
          element={
            <PermissionRoute permission={PERMISSIONS.USER_VIEW}>
              <PlaceholderPage
                title="Users"
                moduleLabel="Later module"
                description="User administration builds on Module 3 authentication and RBAC foundations."
              />
            </PermissionRoute>
          }
        />
        <Route
          path="settings"
          element={
            <PermissionRoute permission={PERMISSIONS.SETTINGS_VIEW}>
              <PlaceholderPage
                title="Settings"
                moduleLabel="Later module"
                description="Company settings and preferences will be implemented in a later module."
              />
            </PermissionRoute>
          }
        />
        <Route
          path="profile"
          element={
            <PermissionRoute permission={PERMISSIONS.PROFILE_VIEW}>
              <ProfilePage />
            </PermissionRoute>
          }
        />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="ui-preview" element={<UiPreviewPage />} />
        <Route path="403" element={<AccessDeniedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
