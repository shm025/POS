import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'

export default function LoginPage() {
  const { login } = useAuth()
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email || !password) { setError(t('login_error_empty')); return }
    setLoading(true)
    setError('')
    try {
      await login(email, password)
    } catch {
      setError(t('login_error_wrong'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, #0F1F3D 0%, #1B3B6F 50%, #1a4a8a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, fontFamily: "'Cairo',sans-serif",
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(14,164,114,0.12) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-10%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(46,91,168,0.2) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
      </div>

      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '44px 40px',
        width: '420px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '58px', height: '58px',
            background: 'linear-gradient(135deg, #1B3B6F, #0EA472)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '26px', margin: '0 auto 16px',
          }}>🏪</div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#1B3B6F', letterSpacing: '-0.5px' }}>
            CATALAN POS
          </div>
          <div style={{ fontSize: '13px', color: '#8A9AB0', marginTop: '4px' }}>
            {t('login_subtitle')}
          </div>
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2', color: '#DC2626',
            padding: '11px 14px', borderRadius: '10px',
            fontSize: '13px', marginBottom: '18px',
            border: '1px solid #FECACA',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#4A5568', marginBottom: '7px' }}>
            {t('login_email')}
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '11px 14px',
              border: '1.5px solid #E2E8F0', borderRadius: '10px',
              fontFamily: "'Cairo',sans-serif", fontSize: '14px',
              direction: 'ltr', transition: 'border-color 0.18s',
              outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = '#1B3B6F'}
            onBlur={e => e.target.style.borderColor = '#E2E8F0'}
            placeholder="example@email.com"
          />
        </div>

        <div style={{ marginBottom: '26px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#4A5568', marginBottom: '7px' }}>
            {t('login_password')}
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', padding: '11px 14px',
              border: '1.5px solid #E2E8F0', borderRadius: '10px',
              fontFamily: "'Cairo',sans-serif", fontSize: '14px',
              direction: 'ltr', transition: 'border-color 0.18s',
              outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = '#1B3B6F'}
            onBlur={e => e.target.style.borderColor = '#E2E8F0'}
            placeholder="••••••••"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '13px',
            background: loading ? '#A0AEC0' : 'linear-gradient(135deg, #1B3B6F, #2E5BA8)',
            color: 'white', border: 'none', borderRadius: '10px',
            fontFamily: "'Cairo',sans-serif", fontSize: '15px', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: loading ? 'none' : '0 4px 14px rgba(27,59,111,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          {loading ? (
            <>
              <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              {t('login_loading')}
            </>
          ) : (
            <>🔐 {t('login_btn')}</>
          )}
        </button>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '11px', color: '#A0AEC0' }}>
          CATALAN POS © 2026 — Powered by Supabase
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
