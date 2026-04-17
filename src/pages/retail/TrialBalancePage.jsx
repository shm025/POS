import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useAccounts } from '../../hooks/useAccounts'
import { useLang } from '../../contexts/LangContext'
import { fmt } from '../../utils/format'

const LOCALE_MAP = { AR: 'ar-LB', EN: 'en-GB', FR: 'fr-FR' }

export default function TrialBalancePage() {
  const { company } = useAuth()
  const { t, lang } = useLang()
  const { accounts, loadAccounts } = useAccounts(company?.id)
  const [search, setSearch] = useState('')

  useEffect(() => { loadAccounts() }, [loadAccounts])

  const filtered = search
    ? accounts.filter(a =>
        (a.code || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.name || '').toLowerCase().includes(search.toLowerCase()))
    : accounts

  const totalDebit  = filtered.reduce((s, a) => s + (a.debit  || 0), 0)
  const totalCredit = filtered.reduce((s, a) => s + (a.credit || 0), 0)

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>⚖️ {t('trial_balance_title')}</h1>
        <button className="btn btn-outline" onClick={() => window.print()}>🖨 {t('print_btn')}</button>
      </div>

      <div className="card no-print" style={{ marginBottom:'12px', padding:'10px 16px' }}>
        <input
          className="form-control"
          placeholder={`🔍 ${t('ph_search_code_name')}`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth:'320px' }}
        />
      </div>

      <div className="card">
        <div style={{ textAlign:'center', marginBottom:'20px' }}>
          <div style={{ fontSize:'18px', fontWeight:900 }} id="trial-co-name">CATALAN POS</div>
          <div style={{ fontSize:'14px', color:'var(--text-muted)' }}>{t('trial_balance_sub')} — {new Date().toLocaleDateString(LOCALE_MAP[lang] || 'en-GB')}</div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>{t('th_code')}</th><th>{t('th_name')}</th><th>{t('th_debit')}</th><th>{t('th_credit')}</th></tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td>{a.code}</td>
                  <td>{a.name}</td>
                  <td style={{ direction:'ltr' }}>{a.debit ? fmt(a.debit) : '-'}</td>
                  <td style={{ direction:'ltr' }}>{a.credit ? fmt(a.credit) : '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight:900, background:'var(--bg-panel)' }}>
                <td colSpan="2" style={{ textAlign:'center' }}>{t('total_label')}</td>
                <td style={{ direction:'ltr', color:'var(--success)' }}>{fmt(totalDebit)}</td>
                <td style={{ direction:'ltr', color:'var(--danger)' }}>{fmt(totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
