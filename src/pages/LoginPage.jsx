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
    <div style={{ position:'fixed', inset:0, background:'#F4F2EE', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, fontFamily:"'Cairo',sans-serif" }}>
      <div style={{ background:'white', borderRadius:'16px', padding:'40px', width:'380px', boxShadow:'0 8px 40px rgba(10,102,194,0.13)', textAlign:'center' }}>
        <div style={{ fontSize:'36px', fontWeight:900, color:'#0A66C2', letterSpacing:'2px', marginBottom:'4px' }}>CATALAN</div>
        <div style={{ fontSize:'13px', color:'#8A9AB0', marginBottom:'32px' }}>{t('login_subtitle')}</div>

        {error && (
          <div style={{ display:'block', background:'#fdecea', color:'#C0392B', padding:'10px', borderRadius:'8px', fontSize:'13px', marginBottom:'16px' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom:'16px', textAlign:'right' }}>
          <label style={{ display:'block', fontSize:'13px', fontWeight:600, color:'#4A5568', marginBottom:'6px' }}>{t('login_email')}</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            style={{ width:'100%', padding:'10px 12px', border:'1px solid #E8E8E8', borderRadius:'8px', fontFamily:"'Cairo',sans-serif", fontSize:'14px', direction:'ltr' }}
            placeholder="example@email.com" />
        </div>

        <div style={{ marginBottom:'24px', textAlign:'right' }}>
          <label style={{ display:'block', fontSize:'13px', fontWeight:600, color:'#4A5568', marginBottom:'6px' }}>{t('login_password')}</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width:'100%', padding:'10px 12px', border:'1px solid #E8E8E8', borderRadius:'8px', fontFamily:"'Cairo',sans-serif", fontSize:'14px', direction:'ltr' }}
            placeholder="••••••••" />
        </div>

        <button onClick={handleLogin} disabled={loading}
          style={{ width:'100%', padding:'12px', background:'#0A66C2', color:'white', border:'none', borderRadius:'8px', fontFamily:"'Cairo',sans-serif", fontSize:'15px', fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1 }}>
          {loading ? t('login_loading') : t('login_btn')}
        </button>

        <div style={{ marginTop:'16px', fontSize:'11px', color:'#8A9AB0' }}>CATALAN POS © 2026</div>
      </div>
    </div>
  )
}
