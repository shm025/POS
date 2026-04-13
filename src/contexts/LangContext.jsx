import { createContext, useContext, useState, useEffect } from 'react'
import { i18n } from '../lib/constants'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('catalan_lang') || 'AR')

  useEffect(() => {
    applyLang(lang)
  }, [lang])

  function applyLang(l) {
    const html = document.documentElement
    if (l === 'EN' || l === 'FR') {
      html.setAttribute('dir', 'ltr')
      html.setAttribute('lang', l.toLowerCase())
    } else {
      html.setAttribute('dir', 'rtl')
      html.setAttribute('lang', 'ar')
    }
    localStorage.setItem('catalan_lang', l)
  }

  function setLang(l) {
    setLangState(l)
  }

  function t(key) {
    return (i18n[lang] || i18n.AR)[key] ?? (i18n.AR[key] ?? key)
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
