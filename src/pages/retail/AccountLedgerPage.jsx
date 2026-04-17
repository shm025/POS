import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useAccounts } from '../../hooks/useAccounts'
import { useJournalEntries } from '../../hooks/useJournalEntries'
import { useCustomers } from '../../hooks/useCustomers'
import { useLang } from '../../contexts/LangContext'
import { supabase } from '../../lib/supabase'
import { fmt } from '../../utils/format'
import TypeaheadInput from '../../components/common/TypeaheadInput'

// selectedId format: 'acc_<uuid>' for chart accounts, 'cust_<uuid>' for customers
function parseSelection(selectedId) {
  if (!selectedId) return { type: null, id: null }
  if (selectedId.startsWith('cust_')) return { type: 'customer', id: selectedId.slice(5) }
  return { type: 'account', id: selectedId.slice(4) }
}

export default function AccountLedgerPage() {
  const { company } = useAuth()
  const { t } = useLang()
  const { accounts, loadAccounts } = useAccounts(company?.id)
  const { entries, loadEntries } = useJournalEntries(company?.id)
  const { customers, loadCustomers } = useCustomers(company?.id)

  const [selectedId, setSelectedId] = useState('')
  const [searchText, setSearchText] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [openingBal, setOpeningBal] = useState(0)
  const [rows, setRows] = useState([])

  useEffect(() => {
    loadAccounts()
    loadEntries()
    loadCustomers()
  }, [loadAccounts, loadEntries, loadCustomers])

  const allPartyItems = [
    ...accounts.map(a => ({ id: `acc_${a.id}`, code: a.code, name: a.name })),
    ...customers.map(c => ({ id: `cust_${c.id}`, code: '', name: c.name })),
  ]

  const buildLedger = useCallback(async () => {
    if (!selectedId) { setRows([]); setDisplayName(''); setOpeningBal(0); return }

    const { type, id } = parseSelection(selectedId)

    if (type === 'account') {
      const acc = accounts.find(a => a.id === id)
      if (!acc) return
      setDisplayName(`${acc.code} - ${acc.name}`)

      const relevant = entries.filter(e => e.debitAccId === id || e.creditAccId === id)

      const before = fromDate ? relevant.filter(e => e.date < fromDate) : []
      const after  = fromDate ? relevant.filter(e => e.date >= fromDate) : relevant

      let opening = (acc.debit || 0) - (acc.credit || 0)
      before.forEach(e => {
        const amt = parseFloat(e.amount) || 0
        if (e.debitAccId === id) opening += amt; else opening -= amt
      })
      setOpeningBal(opening)

      let bal = opening
      setRows(after.map(e => {
        const isDr = e.debitAccId === id
        const amt = parseFloat(e.amount) || 0
        if (isDr) bal += amt; else bal -= amt
        return { date: e.date, desc: e.desc, isDr, amt, runBal: bal }
      }))

    } else if (type === 'customer') {
      const cust = customers.find(c => c.id === id)
      if (!cust) return
      setDisplayName(`👤 ${cust.name}`)

      const [{ data: invData }, { data: voucherData }] = await Promise.all([
        supabase
          .from('invoices')
          .select('date, number, doc_type, total')
          .eq('company_id', company.id)
          .eq('customer_name', cust.name)
          .in('doc_type', ['invoices', 'sales-return'])
          .order('date', { ascending: true }),
        supabase
          .from('vouchers')
          .select('date, number, description, amount')
          .eq('company_id', company.id)
          .eq('type', 'receipt')
          .eq('party', cust.name)
          .order('date', { ascending: true }),
      ])

      const allRows = [
        ...(invData || []).map(inv => ({
          date: inv.date || '',
          desc: inv.doc_type === 'invoices'
            ? `${t('desc_sale_invoice')} ${inv.number}`
            : `${t('desc_sales_return')} ${inv.number}`,
          isDr: inv.doc_type === 'invoices',
          amt: parseFloat(inv.total || 0),
        })),
        ...(voucherData || []).map(v => ({
          date: v.date || '',
          desc: `${t('desc_receipt_voucher')}${v.number ? ' #' + v.number : ''}${v.description ? ' - ' + v.description : ''}`,
          isDr: false,
          amt: parseFloat(v.amount || 0),
        })),
      ].sort((a, b) => (a.date > b.date ? 1 : -1))

      const before = fromDate ? allRows.filter(r => r.date < fromDate) : []
      const after  = fromDate ? allRows.filter(r => r.date >= fromDate) : allRows

      let opening = 0
      before.forEach(r => { if (r.isDr) opening += r.amt; else opening -= r.amt })
      setOpeningBal(opening)

      let bal = opening
      setRows(after.map(r => {
        if (r.isDr) bal += r.amt; else bal -= r.amt
        return { ...r, runBal: bal }
      }))
    }
  }, [selectedId, fromDate, accounts, entries, customers, company?.id])

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>🔍 {t('ledger_title')}</h1>
      </div>

      <div className="card no-print" style={{ marginBottom:'16px' }}>
        <div className="grid-3">
          <div className="form-group">
            <label className="form-label">{t('lbl_account')}</label>
            <TypeaheadInput
              value={searchText}
              onChange={val => { setSearchText(val); if (!val) setSelectedId('') }}
              onSelect={item => {
                setSelectedId(item.id)
                setSearchText(item.id.startsWith('cust_') ? `👤 ${item.name}` : `${item.code} - ${item.name}`)
              }}
              items={allPartyItems}
              showAllOnFocus={true}
              placeholder={t('select_account')}
              renderItem={it => (
                <><span>{it.id.startsWith('cust_') ? `👤 ${it.name}` : `${it.code} - ${it.name}`}</span></>
              )}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('from_date')}</label>
            <input type="date" className="form-control" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ display:'flex', alignItems:'flex-end' }}>
            <button className="btn btn-primary" style={{ width:'100%' }} onClick={buildLedger}>
              🔍 {t('view_btn')}
            </button>
          </div>
        </div>
      </div>

      {displayName && (
        <div className="card">
          <div style={{ marginBottom:'16px', paddingBottom:'12px', borderBottom:'2px solid var(--primary)' }}>
            <div style={{ fontSize:'18px', fontWeight:900, color:'var(--primary)' }}>{displayName}</div>
          </div>
          <div className="ledger-entry ledger-header">
            <div>{t('th_date')}</div><div>{t('th_desc')}</div>
            <div style={{ textAlign:'center' }}>{t('th_debit')}</div>
            <div style={{ textAlign:'center' }}>{t('th_credit')}</div>
            <div style={{ textAlign:'center' }}>{t('th_balance')}</div>
          </div>
          <div className="ledger-entry" style={{ background:'var(--bg-panel)' }}>
            <div>{fromDate || '—'}</div>
            <div style={{ fontWeight:600 }}>{t('opening_balance_row')}</div>
            <div style={{ textAlign:'center', direction:'ltr' }}>{openingBal >= 0 ? fmt(openingBal) : '-'}</div>
            <div style={{ textAlign:'center', direction:'ltr' }}>{openingBal < 0 ? fmt(Math.abs(openingBal)) : '-'}</div>
            <div style={{ fontWeight:700, textAlign:'center', direction:'ltr' }}>{fmt(Math.abs(openingBal))}</div>
          </div>
          {rows.length === 0 ? (
            <div style={{ padding:'20px', textAlign:'center', color:'var(--text-muted)' }}>{t('no_movements')}</div>
          ) : rows.map((r, i) => (
            <div key={i} className="ledger-entry">
              <div>{r.date}</div>
              <div>{r.desc}</div>
              <div style={{ color:'var(--success)', textAlign:'center', direction:'ltr' }}>{r.isDr ? fmt(r.amt) : '-'}</div>
              <div style={{ color:'var(--danger)', textAlign:'center', direction:'ltr' }}>{!r.isDr ? fmt(r.amt) : '-'}</div>
              <div style={{ fontWeight:700, textAlign:'center', direction:'ltr', color: r.runBal >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {fmt(Math.abs(r.runBal))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
