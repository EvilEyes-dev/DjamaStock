import { useEffect, useState } from 'react'
import { Package, Pencil, Trash2, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const EMPTY = { name: '', buy_price: '', sell_price: '', quantity: '' }

export default function Products() {
  const user = useAuth()
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function load() {
    const { data } = await supabase.from('products').select('*').eq('user_id', user.id).order('name')
    setProducts(data || [])
  }

  useEffect(() => { load() }, [])

  function openEdit(p) {
    setForm({ name: p.name, buy_price: String(p.buy_price), sell_price: String(p.sell_price), quantity: String(p.quantity) })
    setEditId(p.id)
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
    const payload = { name: form.name.trim(), buy_price: Number(form.buy_price), sell_price: Number(form.sell_price), quantity: Number(form.quantity) }
    const { error } = editId
      ? await supabase.from('products').update(payload).eq('id', editId)
      : await supabase.from('products').insert({ ...payload, user_id: user.id })
    if (error) { setError(error.message); setLoading(false); return }
    setShowForm(false)
    await load()
    setLoading(false)
  }

  async function handleDelete(id) {
    await supabase.from('products').delete().eq('id', id)
    setConfirmDelete(null)
    setProducts(p => p.filter(x => x.id !== id))
  }

  const fmt = n => new Intl.NumberFormat('fr-GN').format(n)

  return (
    <div className="page pb-nav">
      <div className="page-header">
        <Package size={26} color="var(--green)" />
        <h1 className="page-title">Stock</h1>
      </div>

      {!showForm ? (
        <button className="btn btn-green" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Plus size={20} /> Ajouter un produit
        </button>
      ) : (
        <div className="card">
          <h2 style={{ marginBottom: 14, fontSize: 17 }}>{editId ? 'Modifier le produit' : 'Nouveau produit'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nom du produit</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Riz 25kg" required />
            </div>
            <div className="form-group">
              <label>Prix d'achat (GNF)</label>
              <input type="number" value={form.buy_price} onChange={e => setForm(f => ({ ...f, buy_price: e.target.value }))} placeholder="0" min="0" required />
            </div>
            <div className="form-group">
              <label>Prix de vente (GNF)</label>
              <input type="number" value={form.sell_price} onChange={e => setForm(f => ({ ...f, sell_price: e.target.value }))} placeholder="0" min="0" required />
            </div>
            <div className="form-group">
              <label>Quantité en stock</label>
              <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" min="0" required />
            </div>
            {error && <p className="error">{error}</p>}
            <button className="btn btn-green" type="submit" disabled={loading}>{loading ? '...' : 'Enregistrer'}</button>
            <button className="btn btn-gray mt-12" type="button" onClick={() => setShowForm(false)}>Annuler</button>
          </form>
        </div>
      )}

      <div className="mt-20">
        {products.length === 0
          ? <p className="empty">Aucun produit. Ajoutez votre premier article.</p>
          : products.map(p => (
            <div className="card" key={p.id}>
              <div className="card-row">
                <span className="fw-bold" style={{ fontSize: 17 }}>{p.name}</span>
                <span className={`badge ${p.quantity <= 0 ? 'badge-red' : 'badge-green'}`}>{p.quantity} unités</span>
              </div>
              <div className="card-row mt-12" style={{ fontSize: 14, color: 'var(--gray)' }}>
                <span>Achat: {fmt(p.buy_price)} GNF</span>
                <span className="fw-bold text-green">Vente: {fmt(p.sell_price)} GNF</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-gray btn-sm" onClick={() => openEdit(p)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Pencil size={14} /> Modifier
                </button>
                <button className="btn btn-sm" style={{ background: 'var(--red-light)', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setConfirmDelete(p)}>
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            </div>
          ))
        }
      </div>

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxWidth: 480 }}>
            <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Supprimer "{confirmDelete.name}" ?</p>
            <p style={{ color: 'var(--gray)', marginBottom: 20 }}>Cette action est irréversible.</p>
            <button className="btn btn-red" onClick={() => handleDelete(confirmDelete.id)}>Oui, supprimer</button>
            <button className="btn btn-gray mt-12" onClick={() => setConfirmDelete(null)}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  )
}
