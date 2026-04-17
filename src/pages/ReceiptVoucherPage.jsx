import { useState, useEffect } from 'react'
import { useVouchers } from '../hooks/useVouchers'
import { useAccounts } from '../hooks/useAccounts'
import { useCustomers } from '../hooks/useCustomers'
import { useSuppliers } from '../hooks/useSuppliers'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import TypeaheadInput from '../components/common/TypeaheadInput'
import { fmt } from '../utils/format'

export default function ReceiptVoucherPage() {
  const { company } = useAuth()
  const { t } = useLang()
  const { vouchers, loading, loadVouchers, saveVoucher } = useVouchers(company?.id)
  const { accounts, loadAccounts } = useAccounts(company?.id)
  const { customers, loadCustomers } = useCustomers(company?.id)
  const { suppliers, loadSuppliers } = useSuppliers(company?.id)

  const [form, setForm] = useState({
    number: '', amount: 0,
    date: new Date().toISOString().split('T')[0],
    debitAcc: '', creditAcc: '', desc: '',
  })

  useEffect(() => {
    loadAccounts()
    loadCustomers()
    loadSuppliers()
    loadVouchers('receipt').then(v => {
      setForm(p => ({ ...p, number: `RCV-${new Date().getFullYear()}-${String(v.length + 1).padStart(3, '0')}` }))
    })
  }, [loadVouchers, loadAccounts, loadCustomers, loadSuppliers])

  async function handleSave() {
    if (!form.amount || !form.debitAcc || !form.creditAcc) return
    await saveVoucher({ ...form, type: 'receipt', party: form.debitAcc, method: `${form.debitAcc} | ${form.creditAcc}`, amount: parseFloat(form.amount) || 0 })
    const v = await loadVouchers('receipt')
    setForm(p => ({ ...p, amount: 0, desc: '', debitAcc: '', creditAcc: '', number: `RCV-${new Date().getFullYear()}-${String(v.length + 1).padStart(3, '0')}` }))
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const partyItems = [
    ...accounts.map(a  => ({ id: a.id,  code: a.code,   name: a.name,   _type: 'account'  })),
    ...customers.map(c => ({ id: c.id,  code: c.code||'', name: c.name, _type: 'customer' })),
    ...suppliers.map(s => ({ id: s.id,  code: s.code||'', name: s.name, _type: 'supplier' })),
  ]

  const typeLabel = { account: t('type_account'), customer: t('type_customer'), supplier: t('type_supplier') }

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>💵 {t('receipt_title')}</h1>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">💵 {t('new_receipt_title')}</div></div>

          <div className="form-group">
            <label className="form-label">{t('lbl_voucher_no')}</label>
            <input className="form-control" value={form.number} onChange={f('number')} style={{ direction:'ltr' }} />
          </div>

          <div className="form-group">
            <label className="form-label">{t('lbl_amount')}</label>
            <input type="number" className="form-control" value={form.amount} onChange={f('amount')} />
          </div>

          <div className="form-group">
            <label className="form-label">{t('lbl_date')}</label>
            <input type="date" className="form-control" value={form.date} onChange={f('date')} />
          </div>

          <div className="form-group">
            <label className="form-label">{t('lbl_debit_acc')}</label>
            <TypeaheadInput
              value={form.debitAcc}
              onChange={v => setForm(p => ({ ...p, debitAcc: v }))}
              onSelect={a => setForm(p => ({ ...p, debitAcc: a.code ? `${a.code} - ${a.name}` : a.name }))}
              items={partyItems}
              placeholder={t('ph_code_or_name')}
              renderItem={a => <><span>{a.code ? `${a.code} - ` : ''}{a.name}</span><span className="item-code">{typeLabel[a._type]}</span></>}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('lbl_credit_acc')}</label>
            <TypeaheadInput
              value={form.creditAcc}
              onChange={v => setForm(p => ({ ...p, creditAcc: v }))}
              onSelect={a => setForm(p => ({ ...p, creditAcc: a.code ? `${a.code} - ${a.name}` : a.name }))}
              items={partyItems}
              placeholder={t('ph_code_or_name')}
              renderItem={a => <><span>{a.code ? `${a.code} - ` : ''}{a.name}</span><span className="item-code">{typeLabel[a._type]}</span></>}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('lbl_desc')}</label>
            <textarea className="form-control" rows="2" value={form.desc} onChange={f('desc')} />
          </div>

          <button className="btn btn-success" style={{ width:'100%' }} onClick={handleSave}>
            💾 {t('save_voucher_btn')}
          </button>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">📋 {t('recent_vouchers')}</div></div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('th_number')}</th>
                  <th>{t('th_amount')}</th>
                  <th>{t('th_debit')}</th>
                  <th>{t('th_credit')}</th>
                  <th>{t('th_date')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign:'center', padding:'20px' }}><div className="loading-spinner"></div></td></tr>
                ) : vouchers.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign:'center', padding:'20px', color:'var(--text-muted)' }}>{t('no_vouchers')}</td></tr>
                ) : vouchers.slice(0, 15).map((v, i) => (
                  <tr key={i}>
                    <td style={{ fontSize:'11px', direction:'ltr' }}>{v.number}</td>
                    <td style={{ direction:'ltr' }}>${fmt(v.amount)}</td>
                    <td style={{ fontSize:'11px' }}>{v.method?.split(' | ')[0] || '—'}</td>
                    <td style={{ fontSize:'11px' }}>{v.method?.split(' | ')[1] || '—'}</td>
                    <td>{v.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
