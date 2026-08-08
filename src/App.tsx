import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'
import { AppRoutes } from '@/routes'
import 'react-toastify/dist/ReactToastify.css'

function ThemedToastContainer() {
  const { isDark } = useTheme()
  return (
    <ToastContainer
      position="top-right"
      theme={isDark ? 'dark' : 'light'}
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
    />
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <ThemedToastContainer />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
