import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const NAV = [
  { to: '/', icon: '🏠', label: 'Accueil' },
  { to: '/ventes', icon: '💰', label: 'Ventes' },
  { to: '/stock', icon: '📦', label: 'Stock' },
  { to: '/dettes', icon: '📋', label: 'Dettes' },
]

export default function Layout() {
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(false)

  async function logout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <Outlet />
      </div>

      <nav className="nav">
        {NAV.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
        <button className="nav-item" onClick={() => setConfirm(true)}>
          <span className="nav-icon">🚪</span>
          Sortir
        </button>
      </nav>

      {confirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{ background: 'white', borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxWidth: 480 }}>
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Se déconnecter ?</p>
            <p style={{ color: 'var(--gray)', marginBottom: 20 }}>Vous devrez vous reconnecter pour accéder à votre boutique.</p>
            <button className="btn btn-red" onClick={logout}>Oui, me déconnecter</button>
            <button className="btn btn-gray mt-12" onClick={() => setConfirm(false)}>Annuler</button>
          </div>
        </div>
      )}
    </>
  )
}
