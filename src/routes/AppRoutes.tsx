import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layouts'
import { PERMISSIONS } from '@/constants/permissions'
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
        <Route
          path="employees"
          element={
            <PermissionRoute permission={PERMISSIONS.EMPLOYEE_VIEW}>
              <PlaceholderPage
                title="Employee Management"
                moduleLabel="Module 5"
                description="Employee CRUD, profiles, and directory features will be built in Module 5."
              />
            </PermissionRoute>
          }
        />
        <Route
          path="departments"
          element={
            <PermissionRoute permission={PERMISSIONS.DEPARTMENT_VIEW}>
              <PlaceholderPage
                title="Departments"
                moduleLabel="Module 5"
                description="Department structure and org hierarchy management will arrive with Module 5."
              />
            </PermissionRoute>
          }
        />
        <Route
          path="designations"
          element={
            <PermissionRoute permission={PERMISSIONS.DESIGNATION_VIEW}>
              <PlaceholderPage
                title="Designations"
                moduleLabel="Module 5"
                description="Job titles and designation management will arrive with Module 5."
              />
            </PermissionRoute>
          }
        />
        <Route
          path="attendance"
          element={
            <PermissionRoute permission={PERMISSIONS.ATTENDANCE_VIEW}>
              <PlaceholderPage
                title="Attendance"
                moduleLabel="Module 6"
                description="Attendance tracking, check-in/out, and timesheets will be implemented in Module 6."
              />
            </PermissionRoute>
          }
        />
        <Route
          path="leave"
          element={
            <PermissionRoute permission={PERMISSIONS.LEAVE_VIEW}>
              <PlaceholderPage
                title="Leave Management"
                moduleLabel="Module 7"
                description="Leave policies, requests, and approvals will be implemented in Module 7."
              />
            </PermissionRoute>
          }
        />
        <Route
          path="payroll"
          element={
            <PermissionRoute permission={PERMISSIONS.PAYROLL_VIEW}>
              <PlaceholderPage
                title="Payroll"
                moduleLabel="Module 8"
                description="Salary structures and payroll processing will be implemented in Module 8."
              />
            </PermissionRoute>
          }
        />
        <Route
          path="payslips"
          element={
            <PermissionRoute permission={PERMISSIONS.PAYSLIP_VIEW}>
              <PlaceholderPage
                title="Payslips"
                moduleLabel="Module 8"
                description="Payslip generation and employee access will be implemented in Module 8."
              />
            </PermissionRoute>
          }
        />
        <Route
          path="reports"
          element={
            <PermissionRoute permission={PERMISSIONS.REPORTS_VIEW}>
              <PlaceholderPage
                title="Reports"
                moduleLabel="Module 9"
                description="HR analytics and exportable reports will be implemented in Module 9."
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
                moduleLabel="Module 4"
                description="In-app notifications and alert preferences will be implemented in Module 4."
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
