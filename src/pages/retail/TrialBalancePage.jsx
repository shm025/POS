import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useAccounts } from '../../hooks/useAccounts'
import { useCustomers } from '../../hooks/useCustomers'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useLang } from '../../contexts/LangContext'
import { supabase } from '../../lib/supabase'
import { fmt } from '../../utils/format'

const LOCALE_MAP = { AR: 'ar-LB', EN: 'en-GB', FR: 'fr-FR' }

export default function TrialBalancePage() {
  const { company } = useAuth()
  const { t, lang }  = useLang()
  const { accounts,  loadAccounts  } = useAccounts(company?.id)
  const { customers, loadCustomers } = useCustomers(company?.id)
  const { suppliers, loadSuppliers } = useSuppliers(company?.id)

  const [tab,    setTab]    = useState('accounts')
  const [search, setSearch] = useState('')

  // customer balances: { [customerId]: { debit, credit } }
  const [custBal, setCustBal] = useState({})
  const [suppBal, setSuppBal] = useState({})
  const [balLoading, setBalLoading] = useState(false)

  useEffect(() => {
    loadAccounts()
    loadCustomers()
    loadSuppliers()
  }, [loadAccounts, loadCustomers, loadSuppliers])

  /* ── Load customer balances from invoices + receipt vouchers ── */
  const loadCustomerBalances = useCallback(async () => {
    if (!company?.id || customers.length === 0) return
    setBalLoading(true)
    const [{ data: invs }, { data: vouchers }] = await Promise.all([
      supabase.from('invoices')
        .select('customer_name, doc_type, total')
        .eq('company_id', company.id)
        .in('doc_type', ['invoices', 'sales-return']),
      supabase.from('vouchers')
        .select('party, amount')
        .eq('company_id', company.id)
        .eq('type', 'receipt'),
    ])

    const map = {}
    customers.forEach(c => { map[c.name] = { debit: 0, credit: 0 } })

    ;(invs || []).forEach(inv => {
      if (!map[inv.customer_name]) return
      const amt = parseFloat(inv.total || 0)
      if (inv.doc_type === 'invoices')      map[inv.customer_name].debit  += amt
      else if (inv.doc_type === 'sales-return') map[inv.customer_name].credit += amt
    })
    ;(vouchers || []).forEach(v => {
      if (!map[v.party]) return
      map[v.party].credit += parseFloat(v.amount || 0)
    })

    // map by id for rendering
    const byId = {}
    customers.forEach(c => { byId[c.id] = map[c.name] || { debit: 0, credit: 0 } })
    setCustBal(byId)
    setBalLoading(false)
  }, [company?.id, customers])

  /* ── Load supplier balances from purchase invoices + payment vouchers ── */
  const loadSupplierBalances = useCallback(async () => {
    if (!company?.id || suppliers.length === 0) return
    setBalLoading(true)
    const [{ data: invs }, { data: vouchers }] = await Promise.all([
      supabase.from('invoices')
        .select('customer_name, doc_type, total')
        .eq('company_id', company.id)
        .in('doc_type', ['purchases', 'purchases-return']),
      supabase.from('vouchers')
        .select('party, amount')
        .eq('company_id', company.id)
        .eq('type', 'payment'),
    ])

    const map = {}
    suppliers.forEach(s => { map[s.name] = { debit: 0, credit: 0 } })

    ;(invs || []).forEach(inv => {
      if (!map[inv.customer_name]) return
      const amt = parseFloat(inv.total || 0)
      if (inv.doc_type === 'purchases')         map[inv.customer_name].credit += amt
      else if (inv.doc_type === 'purchases-return') map[inv.customer_name].debit += amt
    })
    ;(vouchers || []).forEach(v => {
      if (!map[v.party]) return
      map[v.party].debit += parseFloat(v.amount || 0)
    })

    const byId = {}
    suppliers.forEach(s => { byId[s.id] = map[s.name] || { debit: 0, credit: 0 } })
    setSuppBal(byId)
    setBalLoading(false)
  }, [company?.id, suppliers])

  useEffect(() => {
    if (tab === 'customers') loadCustomerBalances()
  }, [tab, loadCustomerBalances])

  useEffect(() => {
    if (tab === 'suppliers') loadSupplierBalances()
  }, [tab, loadSupplierBalances])

  /* ── Filtered lists ── */
  const q = search.toLowerCase()

  const filteredAcc = accounts.filter(a =>
    !q || (a.code || '').toLowerCase().includes(q) || (a.name || '').toLowerCase().includes(q)
  )
  const filteredCust = customers.filter(c =>
    !q || (c.name || '').toLowerCase().includes(q) || (c.code || '').toLowerCase().includes(q) || (c.phone || '').includes(q)
  )
  const filteredSupp = suppliers.filter(s =>
    !q || (s.name || '').toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q)
  )

  /* ── Totals ── */
  const accDebit  = filteredAcc.reduce((s, a) => s + (a.debit  || 0), 0)
  const accCredit = filteredAcc.reduce((s, a) => s + (a.credit || 0), 0)

  const custDebit  = filteredCust.reduce((s, c) => s + (custBal[c.id]?.debit  || 0), 0)
  const custCredit = filteredCust.reduce((s, c) => s + (custBal[c.id]?.credit || 0), 0)

  const suppDebit  = filteredSupp.reduce((s, s2) => s + (suppBal[s2.id]?.debit  || 0), 0)
  const suppCredit = filteredSupp.reduce((s, s2) => s + (suppBal[s2.id]?.credit || 0), 0)

  const tabs = [
    { key: 'accounts',  label: `📒 ${t('accounts_title')} (${accounts.length})`   },
    { key: 'customers', label: `👤 ${t('customers_tab')} (${customers.length})`    },
    { key: 'suppliers', label: `🏭 ${t('suppliers_tab')} (${suppliers.length})`    },
  ]

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>⚖️ {t('trial_balance_title')}</h1>
        <button className="btn btn-outline" onClick={() => window.print()}>🖨 {t('print_btn')}</button>
      </div>

      {/* Tabs */}
      <div className="no-print" style={{ display:'flex', gap:'8px', borderBottom:'2px solid var(--border-light)', marginBottom:'16px' }}>
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => { setTab(key); setSearch('') }} style={{
            padding:'8px 18px', border:'none', cursor:'pointer', fontSize:'13px', background:'transparent',
            borderBottom: tab === key ? '2px solid var(--primary)' : '2px solid transparent',
            color: tab === key ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: tab === key ? 700 : 400, marginBottom:'-2px',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
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
        {/* Print title */}
        <div style={{ textAlign:'center', marginBottom:'20px' }}>
          <div style={{ fontSize:'18px', fontWeight:900 }}>{company?.name || 'CATALAN POS'}</div>
          <div style={{ fontSize:'14px', color:'var(--text-muted)' }}>
            {tab === 'accounts'
              ? t('trial_balance_sub')
              : tab === 'customers'
                ? `${t('customers_tab')} — ${t('trial_balance_sub')}`
                : `${t('suppliers_tab')} — ${t('trial_balance_sub')}`
            }
            {' — '}{new Date().toLocaleDateString(LOCALE_MAP[lang] || 'en-GB')}
          </div>
        </div>

        {/* ── Accounts tab ── */}
        {tab === 'accounts' && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('th_code')}</th>
                  <th>{t('th_name')}</th>
                  <th style={{ textAlign:'right' }}>{t('th_debit')}</th>
                  <th style={{ textAlign:'right' }}>{t('th_credit')}</th>
                  <th style={{ textAlign:'right' }}>{t('th_balance')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAcc.length === 0 ? (
                  <tr><td colSpan="5"><div className="empty-state"><div className="icon">📒</div><p>{t('no_accounts')}</p></div></td></tr>
                ) : filteredAcc.map(a => {
                  const bal = (a.debit || 0) - (a.credit || 0)
                  return (
                    <tr key={a.id}>
                      <td><code>{a.code}</code></td>
                      <td>{a.name}</td>
                      <td style={{ direction:'ltr', textAlign:'right' }}>{a.debit  ? fmt(a.debit)  : '-'}</td>
                      <td style={{ direction:'ltr', textAlign:'right' }}>{a.credit ? fmt(a.credit) : '-'}</td>
                      <td style={{ direction:'ltr', textAlign:'right', fontWeight:700, color: bal >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {fmt(Math.abs(bal))} <span style={{ fontSize:'10px' }}>{bal >= 0 ? 'Dr' : 'Cr'}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight:900, background:'var(--bg-panel)' }}>
                  <td colSpan="2" style={{ textAlign:'center' }}>{t('total_label')}</td>
                  <td style={{ direction:'ltr', textAlign:'right', color:'var(--success)' }}>{fmt(accDebit)}</td>
                  <td style={{ direction:'ltr', textAlign:'right', color:'var(--danger)' }}>{fmt(accCredit)}</td>
                  <td style={{ direction:'ltr', textAlign:'right', fontWeight:900 }}>
                    {fmt(Math.abs(accDebit - accCredit))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ── Customers tab ── */}
        {tab === 'customers' && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('th_code')}</th>
                  <th>{t('lbl_name')}</th>
                  <th>{t('lbl_phone')}</th>
                  <th style={{ textAlign:'right' }}>Sales (Dr)</th>
                  <th style={{ textAlign:'right' }}>Receipts (Cr)</th>
                  <th style={{ textAlign:'right' }}>{t('th_balance')}</th>
                </tr>
              </thead>
              <tbody>
                {balLoading ? (
                  <tr><td colSpan="6" style={{ textAlign:'center', padding:'20px' }}><div className="loading-spinner"></div></td></tr>
                ) : filteredCust.length === 0 ? (
                  <tr><td colSpan="6"><div className="empty-state"><div className="icon">👤</div><p>{t('no_customers')}</p></div></td></tr>
                ) : filteredCust.map(c => {
                  const { debit = 0, credit = 0 } = custBal[c.id] || {}
                  const bal = debit - credit
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight:700, color:'var(--primary)', direction:'ltr' }}>{c.code || '—'}</td>
                      <td style={{ fontWeight:600 }}>{c.name}</td>
                      <td style={{ direction:'ltr', fontSize:'12px' }}>{c.phone || '—'}</td>
                      <td style={{ direction:'ltr', textAlign:'right' }}>{debit  ? fmt(debit)  : '-'}</td>
                      <td style={{ direction:'ltr', textAlign:'right' }}>{credit ? fmt(credit) : '-'}</td>
                      <td style={{ direction:'ltr', textAlign:'right', fontWeight:700, color: bal >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {fmt(Math.abs(bal))} <span style={{ fontSize:'10px' }}>{bal >= 0 ? 'Dr' : 'Cr'}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight:900, background:'var(--bg-panel)' }}>
                  <td colSpan="3" style={{ textAlign:'center' }}>{t('total_label')}</td>
                  <td style={{ direction:'ltr', textAlign:'right', color:'var(--success)' }}>{fmt(custDebit)}</td>
                  <td style={{ direction:'ltr', textAlign:'right', color:'var(--danger)' }}>{fmt(custCredit)}</td>
                  <td style={{ direction:'ltr', textAlign:'right', fontWeight:900 }}>
                    {fmt(Math.abs(custDebit - custCredit))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ── Suppliers tab ── */}
        {tab === 'suppliers' && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('th_code')}</th>
                  <th>{t('th_name')}</th>
                  <th>{t('th_phone')}</th>
                  <th style={{ textAlign:'right' }}>Payments (Dr)</th>
                  <th style={{ textAlign:'right' }}>Purchases (Cr)</th>
                  <th style={{ textAlign:'right' }}>{t('th_balance')}</th>
                </tr>
              </thead>
              <tbody>
                {balLoading ? (
                  <tr><td colSpan="6" style={{ textAlign:'center', padding:'20px' }}><div className="loading-spinner"></div></td></tr>
                ) : filteredSupp.length === 0 ? (
                  <tr><td colSpan="6"><div className="empty-state"><div className="icon">🏭</div><p>{t('no_suppliers')}</p></div></td></tr>
                ) : filteredSupp.map(s => {
                  const { debit = 0, credit = 0 } = suppBal[s.id] || {}
                  const bal = credit - debit
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight:700, color:'var(--primary)', direction:'ltr' }}>{s.code || '—'}</td>
                      <td style={{ fontWeight:600 }}>{s.name}</td>
                      <td style={{ direction:'ltr', fontSize:'12px' }}>{s.phone || '—'}</td>
                      <td style={{ direction:'ltr', textAlign:'right' }}>{debit  ? fmt(debit)  : '-'}</td>
                      <td style={{ direction:'ltr', textAlign:'right' }}>{credit ? fmt(credit) : '-'}</td>
                      <td style={{ direction:'ltr', textAlign:'right', fontWeight:700, color: bal >= 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {fmt(Math.abs(bal))} <span style={{ fontSize:'10px' }}>{bal >= 0 ? 'Cr' : 'Dr'}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight:900, background:'var(--bg-panel)' }}>
                  <td colSpan="3" style={{ textAlign:'center' }}>{t('total_label')}</td>
                  <td style={{ direction:'ltr', textAlign:'right', color:'var(--success)' }}>{fmt(suppDebit)}</td>
                  <td style={{ direction:'ltr', textAlign:'right', color:'var(--danger)' }}>{fmt(suppCredit)}</td>
                  <td style={{ direction:'ltr', textAlign:'right', fontWeight:900 }}>
                    {fmt(Math.abs(suppCredit - suppDebit))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
