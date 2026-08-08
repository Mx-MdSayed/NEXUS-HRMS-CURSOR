import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layouts'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { ProfilePage } from '@/pages/ProfilePage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route
          path="employees"
          element={
            <PlaceholderPage
              title="Employee Management"
              moduleLabel="Module 5"
              description="Employee CRUD, profiles, and directory features will be built in Module 5."
            />
          }
        />
        <Route
          path="departments"
          element={
            <PlaceholderPage
              title="Departments"
              moduleLabel="Module 5"
              description="Department structure and org hierarchy management will arrive with Module 5."
            />
          }
        />
        <Route
          path="designations"
          element={
            <PlaceholderPage
              title="Designations"
              moduleLabel="Module 5"
              description="Job titles and designation management will arrive with Module 5."
            />
          }
        />
        <Route
          path="attendance"
          element={
            <PlaceholderPage
              title="Attendance"
              moduleLabel="Module 6"
              description="Attendance tracking, check-in/out, and timesheets will be implemented in Module 6."
            />
          }
        />
        <Route
          path="leave"
          element={
            <PlaceholderPage
              title="Leave Management"
              moduleLabel="Module 7"
              description="Leave policies, requests, and approvals will be implemented in Module 7."
            />
          }
        />
        <Route
          path="payroll"
          element={
            <PlaceholderPage
              title="Payroll"
              moduleLabel="Module 8"
              description="Salary structures and payroll processing will be implemented in Module 8."
            />
          }
        />
        <Route
          path="payslips"
          element={
            <PlaceholderPage
              title="Payslips"
              moduleLabel="Module 8"
              description="Payslip generation and employee access will be implemented in Module 8."
            />
          }
        />
        <Route
          path="reports"
          element={
            <PlaceholderPage
              title="Reports"
              moduleLabel="Module 9"
              description="HR analytics and exportable reports will be implemented in Module 9."
            />
          }
        />
        <Route
          path="notifications"
          element={
            <PlaceholderPage
              title="Notifications"
              moduleLabel="Module 4"
              description="In-app notifications and alert preferences will be implemented in Module 4."
            />
          }
        />
        <Route
          path="users"
          element={
            <PlaceholderPage
              title="Users"
              moduleLabel="Module 3"
              description="User accounts, roles, and access control will be implemented in Module 3."
            />
          }
        />
        <Route
          path="settings"
          element={
            <PlaceholderPage
              title="Settings"
              moduleLabel="Module 2"
              description="Company settings and preferences will be implemented in Module 2."
            />
          }
        />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
