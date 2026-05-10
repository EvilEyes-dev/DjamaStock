import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Sales from './pages/Sales'
import Products from './pages/Products'
import Debts from './pages/Debts'

function ProtectedRoutes() {
  const user = useAuth()
  if (user === undefined) return <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>⏳</div>
  if (!user) return <Navigate to="/login" replace />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ventes" element={<Sales />} />
        <Route path="/stock" element={<Products />} />
        <Route path="/dettes" element={<Debts />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthRedirect />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

function AuthRedirect() {
  const user = useAuth()
  if (user === undefined) return null
  if (user) return <Navigate to="/" replace />
  return <Login />
}
