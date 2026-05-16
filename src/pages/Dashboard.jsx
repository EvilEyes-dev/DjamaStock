import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, FileText, Package, ShoppingCart, User } from 'lucide-react'
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
        <div style={{ background: 'var(--green)', borderRadius: 10, padding: 8, display: 'flex' }}>
          <ShoppingCart size={22} color="white" />
        </div>
        <div>
          <h1 className="page-title">DjamaStock</h1>
          {(user.user_metadata?.first_name || user.user_metadata?.last_name) && (
            <p style={{ fontSize: 14, color: 'var(--gray)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <User size={13} /> {user.user_metadata.first_name} {user.user_metadata.last_name}
            </p>
          )}
          <p style={{ fontSize: 12, color: 'var(--gray)' }}>{user.email}</p>
        </div>
      </div>

      {loading ? <p style={{ color: 'var(--gray)' }}>Chargement...</p> : (
        <div className="stats">
          <div className="stat-card" onClick={() => navigate('/ventes')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <TrendingUp size={16} color="var(--green)" />
              <span className="stat-label" style={{ margin: 0 }}>Ventes aujourd'hui</span>
            </div>
            <div className="stat-value text-green">{fmt(stats.todaySales)}</div>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>{stats.todayCount} vente(s)</div>
          </div>
          <div className="stat-card" onClick={() => navigate('/dettes')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <FileText size={16} color="var(--red)" />
              <span className="stat-label" style={{ margin: 0 }}>Dettes en cours</span>
            </div>
            <div className="stat-value text-red">{fmt(stats.debts)}</div>
          </div>
          <div className="stat-card" onClick={() => navigate('/stock')} style={{ cursor: 'pointer', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Package size={16} />
              <span className="stat-label" style={{ margin: 0 }}>Articles en stock</span>
            </div>
            <div className="stat-value">{stats.stock} unités</div>
          </div>
        </div>
      )}
    </div>
  )
}
