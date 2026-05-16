import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, TrendingUp, Package, FileText, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getQueue } from '../lib/offlineQueue'

const NAV = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/ventes', icon: TrendingUp, label: 'Ventes' },
  { to: '/stock', icon: Package, label: 'Stock' },
  { to: '/dettes', icon: FileText, label: 'Dettes' },
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

      <nav className="nav" style={{ maxWidth: 480, left: '50%', transform: 'translateX(-50%)' }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <Icon size={22} />
              {to === '/ventes' && getQueue().length > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -6, background: 'var(--orange)', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 700, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getQueue().length}
                </span>
              )}
            </div>
            {label}
          </NavLink>
        ))}
        <button className="nav-item" onClick={() => setConfirm(true)}>
          <LogOut size={22} />
          Sortir
        </button>
      </nav>

      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
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
