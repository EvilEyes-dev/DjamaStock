import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const EMPTY = { client_name: '', amount: '' }

export default function Debts() {
  const user = useAuth()
  const [debts, setDebts] = useState([])
  const [sales, setSales] = useState({}) // sale_id -> sale
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function load() {
    const { data: debtsData } = await supabase.from('debts').select('*').eq('user_id', user.id)
      .order('paid').order('created_at', { ascending: false })
    setDebts(debtsData || [])

    // Load linked sales
    const saleIds = [...new Set((debtsData || []).map(d => d.sale_id).filter(Boolean))]
    if (saleIds.length > 0) {
      const { data: salesData } = await supabase.from('sales').select('id, product_name, quantity, created_at').in('id', saleIds)
      const map = {}
      ;(salesData || []).forEach(s => { map[s.id] = s })
      setSales(map)
    }
  }

  useEffect(() => { load() }, [])

  function openEdit(d) {
    setForm({ client_name: d.client_name, amount: String(d.amount) })
    setEditId(d.id)
    setShowForm(true)
    setError('')
  }

  function openAdd() {
    setForm(EMPTY)
    setEditId(null)
    setShowForm(true)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const payload = { client_name: form.client_name.trim(), amount: Number(form.amount) }
    const { error } = editId
      ? await supabase.from('debts').update(payload).eq('id', editId)
      : await supabase.from('debts').insert({ ...payload, user_id: user.id })
    if (error) { setError(error.message); setLoading(false); return }
    setShowForm(false)
    await load()
    setLoading(false)
  }

  async function markPaid(id) {
    await supabase.from('debts').update({ paid: true }).eq('id', id)
    setDebts(d => d.map(x => x.id === id ? { ...x, paid: true } : x))
  }

  async function handleDelete(id) {
    await supabase.from('debts').delete().eq('id', id)
    setConfirmDelete(null)
    setDebts(d => d.filter(x => x.id !== id))
  }

  const fmt = n => new Intl.NumberFormat('fr-GN').format(n)
  const unpaid = debts.filter(d => !d.paid)
  const paid = debts.filter(d => d.paid)
  const totalUnpaid = unpaid.reduce((s, d) => s + Number(d.amount), 0)

  function SaleLink({ saleId }) {
    const s = sales[saleId]
    if (!s) return null
    const date = new Date(s.created_at).toLocaleDateString('fr-GN', { day: 'numeric', month: 'short' })
    return (
      <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 6 }}>
        🔗 Vente du {date} : {s.product_name} × {s.quantity}
      </p>
    )
  }

  return (
    <div className="page pb-nav">
      <div className="page-header">
        <h1 className="page-title">📋 Dettes</h1>
      </div>

      {unpaid.length > 0 && (
        <div className="card" style={{ background: 'var(--red-light)', marginBottom: 16 }}>
          <span style={{ fontSize: 14, color: 'var(--red)', fontWeight: 600 }}>Total dû: </span>
          <span className="fw-bold text-red" style={{ fontSize: 20 }}>{fmt(totalUnpaid)} GNF</span>
        </div>
      )}

      {!showForm ? (
        <button className="btn btn-blue" onClick={openAdd}>+ Ajouter une dette</button>
      ) : (
        <div className="card">
          <h2 style={{ marginBottom: 14, fontSize: 17 }}>{editId ? 'Modifier la dette' : 'Nouvelle dette'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nom du client</label>
              <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                placeholder="Ex: Fatoumata Bah" required />
            </div>
            <div className="form-group">
              <label>Montant (GNF)</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0" min="1" required />
            </div>
            {error && <p className="error">{error}</p>}
            <button className="btn btn-blue" type="submit" disabled={loading}>
              {loading ? '...' : editId ? '💾 Enregistrer' : 'Enregistrer'}
            </button>
            <button className="btn btn-gray mt-12" type="button" onClick={() => setShowForm(false)}>Annuler</button>
          </form>
        </div>
      )}

      <div className="mt-20">
        {unpaid.length === 0 && paid.length === 0 && <p className="empty">Aucune dette enregistrée.</p>}

        {unpaid.map(d => (
          <div className="card" key={d.id}>
            <div className="card-row">
              <span className="fw-bold" style={{ fontSize: 17 }}>👤 {d.client_name}</span>
              <span className="fw-bold text-red">{fmt(d.amount)} GNF</span>
            </div>
            {d.sale_id && <SaleLink saleId={d.sale_id} />}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-green btn-sm" onClick={() => markPaid(d.id)}>✅ Payé</button>
              <button className="btn btn-gray btn-sm" onClick={() => openEdit(d)}>✏️ Modifier</button>
              <button className="btn btn-sm" style={{ background: 'var(--red-light)', color: 'var(--red)' }} onClick={() => setConfirmDelete(d)}>🗑️</button>
            </div>
          </div>
        ))}

        {paid.length > 0 && (
          <>
            <div className="divider" />
            <p style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 10 }}>Dettes réglées</p>
            {paid.map(d => (
              <div className="card" key={d.id} style={{ opacity: 0.6 }}>
                <div className="card-row">
                  <span>👤 {d.client_name}</span>
                  <span className="badge badge-green">Payé — {fmt(d.amount)} GNF</span>
                </div>
                {d.sale_id && <SaleLink saleId={d.sale_id} />}
              </div>
            ))}
          </>
        )}
      </div>

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxWidth: 480 }}>
            <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Supprimer la dette de "{confirmDelete.client_name}" ?</p>
            <p style={{ color: 'var(--gray)', marginBottom: 20 }}>Cette action est irréversible.</p>
            <button className="btn btn-red" onClick={() => handleDelete(confirmDelete.id)}>Oui, supprimer</button>
            <button className="btn btn-gray mt-12" onClick={() => setConfirmDelete(null)}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  )
}
