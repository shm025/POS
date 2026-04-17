import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [company, setCompany] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Always sign out on cold load (preserves original behavior)
    supabase.auth.signOut().then(() => setLoading(false))
  }, [])

  async function fetchCompanyData(authUser) {
    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profErr || !prof) return null

    const { data: comp, error: compErr } = await supabase
      .from('companies')
      .select('*')
      .eq('id', prof.company_id)
      .single()

    if (compErr || !comp) return null

    return { prof, comp }
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    const result = await fetchCompanyData(data.user)
    if (!result) throw new Error('Company data not found')

    setUser(data.user)
    setProfile(result.prof)
    setCompany(result.comp)
    return result.comp
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setCompany(null)
  }

  async function refreshCompany() {
    if (!user) return
    const result = await fetchCompanyData(user)
    if (result) setCompany(result.comp)
  }

  return (
    <AuthContext.Provider value={{ user, company, profile, loading, login, logout, refreshCompany }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
