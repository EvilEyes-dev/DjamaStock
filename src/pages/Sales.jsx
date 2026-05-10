import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const EMPTY = { product_id: '', quantity: '1', payment_type: 'cash', client_name: '' }

export default function Sales() {
  const user = useAuth()
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [offline, setOffline] = useState(!navigator.onLine)
  const submitting = useRef(false)

  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  async function load() {
    const [pRes, sRes] = await Promise.all([
      supabase.from('products').select('*').eq('user_id', user.id).order('name'),
      supabase.from('sales').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    setProducts(pRes.data || [])
    setSales(sRes.data || [])
  }

  useEffect(() => { load() }, [])

  const selectedProduct = products.find(p => p.id === form.product_id)
  const total = selectedProduct ? selectedProduct.sell_price * Number(form.quantity) : 0

  async function handleSell(e) {
    e.preventDefault()
    if (submitting.current) return   // point 4: block double submit
    setError('')

    if (!navigator.onLine) { setError('Pas de connexion internet. Réessayez.'); return }  // point 5
    if (!selectedProduct) return
    const qty = Number(form.quantity)
    if (qty <= 0) { setError('Quantité invalide'); return }
    if (selectedProduct.quantity < qty) { setError('Stock insuffisant'); return }

    submitting.current = true
    setLoading(true)

    const { data: saleData, error: saleErr } = await supabase.from('sales').insert({
      user_id: user.id,
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      quantity: qty,
      unit_price: selectedProduct.sell_price,
      total,
      payment_type: form.payment_type,
      client_name: form.client_name || null,
    }).select().single()

    if (saleErr) {
      setError(saleErr.message.includes('fetch') ? 'Erreur réseau. Vérifiez votre connexion.' : saleErr.message)
      submitting.current = false
      setLoading(false)
      return
    }

    await supabase.from('products').update({ quantity: selectedProduct.quantity - qty }).eq('id', selectedProduct.id)

    if (form.payment_type === 'credit') {
      await supabase.from('debts').insert({
        user_id: user.id,
        client_name: form.client_name || 'Client inconnu',
        amount: total,
        sale_id: saleData.id,
      })
    }

    setForm(EMPTY)
    setShowForm(false)
    await load()
    submitting.current = false
    setLoading(false)
  }

  const fmt = n => new Intl.NumberFormat('fr-GN').format(n)

  // Group sales by date
  const grouped = sales.reduce((acc, s) => {
    const day = s.created_at.split('T')[0]
    if (!acc[day]) acc[day] = []
    acc[day].push(s)
    return acc
  }, {})

  const today = new Date().toISOString().split('T')[0]
  const fmtDay = d => d === today ? "Aujourd'hui" : new Date(d).toLocaleDateString('fr-GN', { day: 'numeric', month: 'long' })

  return (
    <div className="page pb-nav">
      {offline && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
          ⚠️ Vous êtes hors ligne
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">💰 Ventes</h1>
      </div>

      {!showForm ? (
        <button className="btn btn-green" onClick={() => setShowForm(true)}>+ Nouvelle vente</button>
      ) : (
        <div className="card">
          <h2 style={{ marginBottom: 14, fontSize: 17 }}>Enregistrer une vente</h2>
          <form onSubmit={handleSell}>
            <div className="form-group">
              <label>Produit</label>
              <select value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))} required>
                <option value="">-- Choisir un produit --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                    {p.name} ({p.quantity} dispo) — {fmt(p.sell_price)} GNF
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Quantité</label>
              <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} min="1" required />
            </div>

            {total > 0 && (
              <div className="card" style={{ background: 'var(--green-light)', marginBottom: 14 }}>
                <span className="fw-bold text-green" style={{ fontSize: 20 }}>Total: {fmt(total)} GNF</span>
              </div>
            )}

            <div className="form-group">
              <label>Paiement</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {['cash', 'credit'].map(type => (
                  <button key={type} type="button"
                    className={`btn ${form.payment_type === type ? 'btn-green' : 'btn-gray'}`}
                    onClick={() => setForm(f => ({ ...f, payment_type: type }))}>
                    {type === 'cash' ? '💵 Cash' : '📋 Crédit'}
                  </button>
                ))}
              </div>
            </div>

            {form.payment_type === 'credit' && (
              <div className="form-group">
                <label>Nom du client</label>
                <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                  placeholder="Ex: Mamadou Diallo" required />
              </div>
            )}

            {error && <p className="error">{error}</p>}
            <button className="btn btn-green" type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : '✅ Confirmer la vente'}
            </button>
            <button className="btn btn-gray mt-12" type="button" onClick={() => { setShowForm(false); setError('') }}>
              Annuler
            </button>
          </form>
        </div>
      )}

      <div className="mt-20">
        {Object.keys(grouped).length === 0
          ? <p className="empty">Aucune vente enregistrée.</p>
          : Object.keys(grouped).map(day => (
            <div key={day}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray)', marginBottom: 8, marginTop: 16 }}>
                {fmtDay(day)} — {fmt(grouped[day].reduce((s, x) => s + Number(x.total), 0))} GNF
              </p>
              {grouped[day].map(s => (
                <div className="card" key={s.id}>
                  <div className="card-row">
                    <span className="fw-bold">{s.product_name}</span>
                    <span className="fw-bold text-green">{fmt(s.total)} GNF</span>
                  </div>
                  <div className="card-row mt-12" style={{ fontSize: 13, color: 'var(--gray)' }}>
                    <span>Qté: {s.quantity}</span>
                    <span className={`badge ${s.payment_type === 'cash' ? 'badge-green' : 'badge-red'}`}>
                      {s.payment_type === 'cash' ? 'Cash' : `Crédit — ${s.client_name}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))
        }
      </div>
    </div>
  )
}
