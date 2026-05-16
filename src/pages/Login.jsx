import { useState } from 'react'
import { Eye, EyeOff, ShoppingCart } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { first_name: form.firstName.trim(), last_name: form.lastName.trim() } },
      })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', background: 'var(--green)', borderRadius: 20, padding: 16, marginBottom: 12 }}>
          <ShoppingCart size={40} color="white" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>DjamaStock</h1>
        <p style={{ color: 'var(--gray)', marginTop: 4 }}>Gérez votre boutique simplement</p>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <>
            <div className="form-group">
              <label>Prénom</label>
              <input value={form.firstName} onChange={set('firstName')} placeholder="Ex: Mamadou" required />
            </div>
            <div className="form-group">
              <label>Nom</label>
              <input value={form.lastName} onChange={set('lastName')} placeholder="Ex: Diallo" required />
            </div>
          </>
        )}
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="votre@email.com" required />
        </div>
        <div className="form-group">
          <label>Mot de passe</label>
          <div style={{ position: 'relative' }}>
            <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')}
              placeholder="••••••••" required minLength={6} style={{ paddingRight: 52 }} />
            <button type="button" onClick={() => setShowPwd(v => !v)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)', display: 'flex' }}>
              {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-green mt-20" type="submit" disabled={loading}>
          {loading ? '...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
        </button>
      </form>

      <button className="btn btn-gray mt-12" type="button" onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError('') }}>
        {mode === 'login' ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
      </button>
    </div>
  )
}
