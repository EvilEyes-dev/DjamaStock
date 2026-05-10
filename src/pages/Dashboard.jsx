import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const user = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ todaySales: 0, todayCount: 0, debts: 0, stock: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0]

      const [salesRes, debtsRes, productsRes] = await Promise.all([
        supabase.from('sales').select('total').eq('user_id', user.id).gte('created_at', today),
        supabase.from('debts').select('amount').eq('user_id', user.id).eq('paid', false),
        supabase.from('products').select('quantity').eq('user_id', user.id),
      ])

      const todaySales = (salesRes.data || []).reduce((s, r) => s + Number(r.total), 0)
      const debts = (debtsRes.data || []).reduce((s, r) => s + Number(r.amount), 0)
      const stock = (productsRes.data || []).reduce((s, r) => s + r.quantity, 0)

      setStats({ todaySales, todayCount: salesRes.data?.length || 0, debts, stock })
      setLoading(false)
    }
    load()
  }, [user.id])

  const fmt = n => new Intl.NumberFormat('fr-GN').format(n) + ' GNF'

  return (
    <div className="page pb-nav">
      <div className="page-header">
        <span style={{ fontSize: 28 }}>🛒</span>
        <div>
          <h1 className="page-title">DjamaStock</h1>
          {(user.user_metadata?.first_name || user.user_metadata?.last_name) && (
            <p style={{ fontSize: 14, color: 'var(--gray)', marginTop: 2 }}>
              👤 {user.user_metadata.first_name} {user.user_metadata.last_name}
            </p>
          )}
          <p style={{ fontSize: 12, color: 'var(--gray)' }}>{user.email}</p>
        </div>
      </div>

      {loading ? <p style={{ color: 'var(--gray)' }}>Chargement...</p> : (
        <>
          <div className="stats">
            <div className="stat-card" onClick={() => navigate('/ventes')} style={{ cursor: 'pointer' }}>
              <div className="stat-label">💰 Ventes aujourd'hui</div>
              <div className="stat-value text-green">{fmt(stats.todaySales)}</div>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>{stats.todayCount} vente(s)</div>
            </div>
            <div className="stat-card" onClick={() => navigate('/dettes')} style={{ cursor: 'pointer' }}>
              <div className="stat-label">📋 Dettes en cours</div>
              <div className="stat-value text-red">{fmt(stats.debts)}</div>
            </div>
            <div className="stat-card" onClick={() => navigate('/stock')} style={{ cursor: 'pointer', gridColumn: '1 / -1' }}>
              <div className="stat-label">📦 Articles en stock</div>
              <div className="stat-value">{stats.stock} unités</div>
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'var(--gray)', textAlign: 'center' }}>
            Utilisez le menu en bas pour naviguer
          </p>
        </>
      )}
    </div>
  )
}
