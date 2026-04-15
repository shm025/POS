import { useState, useEffect } from 'react'
import { useVouchers } from '../hooks/useVouchers'
import { useSuppliers } from '../hooks/useSuppliers'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { fmt } from '../utils/format'

export default function PaymentVoucherPage() {
  const { company } = useAuth()
  const { t } = useLang()
  const { vouchers, loading, loadVouchers, saveVoucher } = useVouchers(company?.id)
  const { suppliers, loadSuppliers } = useSuppliers(company?.id)
  const [form, setForm] = useState({
    number: '', party: '', amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: 'cash', desc: ''
  })

  useEffect(() => {
    loadSuppliers()
    loadVouchers('payment').then(v => {
      setForm(p => ({ ...p, number: `PAY-${new Date().getFullYear()}-${String(v.length + 1).padStart(3, '0')}` }))
    })
  }, [loadVouchers, loadSuppliers])

  async function handleSave() {
    if (!form.amount || !form.party) return
    await saveVoucher({ ...form, type: 'payment', amount: parseFloat(form.amount) || 0 })
    const v = await loadVouchers('payment')
    setForm(p => ({ ...p, party: '', amount: 0, desc: '', number: `PAY-${new Date().getFullYear()}-${String(v.length + 1).padStart(3, '0')}` }))
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)' }}>💸 {t('payment_title')}</h1>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">💸 {t('new_payment_title')}</div></div>
          <div className="form-group"><label className="form-label">{t('lbl_voucher_no')}</label><input className="form-control" value={form.number} onChange={f('number')} style={{ direction: 'ltr' }} /></div>
          <div className="form-group">
            <label className="form-label">{t('lbl_paid_to')}</label>
            <select className="form-control" value={form.party} onChange={f('party')}>
              <option value="">{t('select_placeholder')}</option>
              {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">{t('lbl_amount')}</label><input type="number" className="form-control" value={form.amount} onChange={f('amount')} /></div>
          <div className="form-group"><label className="form-label">{t('lbl_date')}</label><input type="date" className="form-control" value={form.date} onChange={f('date')} /></div>
          <div className="form-group">
            <label className="form-label">{t('lbl_method')}</label>
            <select className="form-control" value={form.method} onChange={f('method')}>
              <option value="cash">{t('pay_cash')}</option>
              <option value="bank">{t('pay_bank')}</option>
              <option value="check">{t('pay_check')}</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">{t('lbl_desc')}</label><textarea className="form-control" rows="2" value={form.desc} onChange={f('desc')} /></div>
          <button className="btn btn-success" style={{ width: '100%' }} onClick={handleSave}>💾 {t('save_voucher_btn')}</button>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">📋 {t('recent_vouchers')}</div></div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>{t('th_number')}</th><th>{t('th_to')}</th><th>{t('th_amount')}</th><th>{t('th_date')}</th></tr></thead>
              <tbody>
                {vouchers.slice(0, 15).map((v, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: '11px', direction: 'ltr' }}>{v.number}</td>
                    <td>{v.party}</td>
                    <td style={{ direction: 'ltr' }}>${fmt(v.amount)}</td>
                    <td>{v.date}</td>
                  </tr>
                ))}
                {vouchers.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>{t('no_vouchers')}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
