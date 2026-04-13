import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email || !password) {
      setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(email, password)
    } catch {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#F5F0E8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, fontFamily: "'Cairo',sans-serif",
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '40px',
        width: '380px', boxShadow: '0 8px 40px rgba(139,26,26,0.16)', textAlign: 'center',
      }}>
        <div style={{ fontSize: '36px', fontWeight: 900, color: '#8B1A1A', letterSpacing: '2px', marginBottom: '4px' }}>
          CATALAN
        </div>
        <div style={{ fontSize: '13px', color: '#9A8A7A', marginBottom: '32px' }}>
          نظام إدارة الأعمال
        </div>

        {error && (
          <div style={{ display: 'block', background: '#F8D7DA', color: '#721C24', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '16px', textAlign: 'right' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#5A4A3A', marginBottom: '6px' }}>
            البريد الإلكتروني
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #D8C8A8', borderRadius: '8px', fontFamily: "'Cairo',sans-serif", fontSize: '14px', direction: 'ltr' }}
            placeholder="example@email.com"
          />
        </div>

        <div style={{ marginBottom: '24px', textAlign: 'right' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#5A4A3A', marginBottom: '6px' }}>
            كلمة المرور
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #D8C8A8', borderRadius: '8px', fontFamily: "'Cairo',sans-serif", fontSize: '14px', direction: 'ltr' }}
            placeholder="••••••••"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%', padding: '12px', background: '#8B1A1A', color: 'white', border: 'none', borderRadius: '8px', fontFamily: "'Cairo',sans-serif", fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
        </button>

        <div style={{ marginTop: '16px', fontSize: '11px', color: '#9A8A7A' }}>
          CATALAN POS © 2026
        </div>
      </div>
    </div>
  )
}
