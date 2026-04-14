import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAccounts } from '../hooks/useAccounts'
import { useJournalEntries } from '../hooks/useJournalEntries'
import { useLang } from '../contexts/LangContext'
import { fmt } from '../utils/format'

export default function AccountLedgerPage() {
  const { company } = useAuth()
  const { t } = useLang()
  const { accounts, loadAccounts } = useAccounts(company?.id)
  const { entries, loadEntries } = useJournalEntries(company?.id)
  const [selectedId, setSelectedId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [account, setAccount] = useState(null)
  const [rows, setRows] = useState([])

  useEffect(() => { loadAccounts(); loadEntries() }, [loadAccounts, loadEntries])

  useEffect(() => {
    if (!selectedId) { setRows([]); setAccount(null); return }
    const acc = accounts.find(a => a.id === selectedId)
    setAccount(acc || null)
    if (!acc) return
    const relevant = entries.filter(e => e.debitAccId === selectedId || e.creditAccId === selectedId)
    let bal = (acc.debit || 0) - (acc.credit || 0)
    const r = relevant.map(e => {
      const isDr = e.debitAccId === selectedId
      const amt = parseFloat(e.amount) || 0
      if (isDr) bal += amt; else bal -= amt
      return { ...e, isDr, amt, runBal: bal }
    })
    setRows(r)
  }, [selectedId, entries, accounts])

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>🔍 {t('ledger_title')}</h1>
      </div>

      <div className="card no-print" style={{ marginBottom:'16px' }}>
        <div className="grid-3">
          <div className="form-group">
            <label className="form-label">{t('lbl_account')}</label>
            <select className="form-control" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
              <option value="">{t('select_account')}</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('from_date')}</label>
            <input type="date" className="form-control" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ display:'flex', alignItems:'flex-end' }}>
            <button className="btn btn-primary" style={{ width:'100%' }}>🔍 {t('view_btn')}</button>
          </div>
        </div>
      </div>

      {account && (
        <div className="card">
          <div style={{ marginBottom:'16px', paddingBottom:'12px', borderBottom:'2px solid var(--primary)' }}>
            <div style={{ fontSize:'18px', fontWeight:900, color:'var(--primary)' }}>{account.code} - {account.name}</div>
          </div>
          <div className="ledger-entry ledger-header">
            <div>{t('th_date')}</div><div>{t('th_desc')}</div>
            <div style={{ textAlign:'center' }}>{t('th_debit')}</div>
            <div style={{ textAlign:'center' }}>{t('th_credit')}</div>
            <div style={{ textAlign:'center' }}>{t('th_balance')}</div>
          </div>
          <div className="ledger-entry" style={{ background:'var(--bg-panel)' }}>
            <div>{fromDate}</div>
            <div style={{ fontWeight:600 }}>{t('opening_balance_row')}</div>
            <div style={{ textAlign:'center', direction:'ltr' }}>{fmt(account.debit)}</div>
            <div style={{ textAlign:'center', direction:'ltr' }}>{fmt(account.credit)}</div>
            <div style={{ fontWeight:700, textAlign:'center', direction:'ltr' }}>{fmt((account.debit||0)-(account.credit||0))}</div>
          </div>
          {rows.length === 0 ? (
            <div style={{ padding:'20px', textAlign:'center', color:'var(--text-muted)' }}>{t('no_movements')}</div>
          ) : rows.map((r, i) => (
            <div key={i} className="ledger-entry">
              <div>{r.date}</div>
              <div>{r.desc}</div>
              <div style={{ color:'var(--success)', textAlign:'center', direction:'ltr' }}>{r.isDr ? fmt(r.amt) : '-'}</div>
              <div style={{ color:'var(--danger)', textAlign:'center', direction:'ltr' }}>{!r.isDr ? fmt(r.amt) : '-'}</div>
              <div style={{ fontWeight:700, textAlign:'center', direction:'ltr', color:r.runBal>=0?'var(--success)':'var(--danger)' }}>{fmt(Math.abs(r.runBal))}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
