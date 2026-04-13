import { useState, useEffect } from 'react'
import { useVouchers } from '../hooks/useVouchers'
import { useLang } from '../contexts/LangContext'
import { fmt } from '../utils/format'

const PARTIES = ['شركة الأمل التجارية','مؤسسة النجاح','شركة الخليج','محلات السعادة','مورد الإلكترونيات','مورد القرطاسية']

export default function ReceiptVoucherPage() {
  const { t } = useLang()
  const { vouchers, loading, loadVouchers, saveVoucher } = useVouchers()
  const [form, setForm] = useState({
    number: '', party: '', amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: 'cash', desc: ''
  })

  useEffect(() => {
    loadVouchers('receipt').then(v => {
      setForm(p => ({ ...p, number: `RCV-2026-${String(v.length + 1).padStart(3, '0')}` }))
    })
  }, [loadVouchers])

  async function handleSave() {
    if (!form.amount || !form.party) { return }
    await saveVoucher({ ...form, type: 'receipt', amount: parseFloat(form.amount) || 0 })
    loadVouchers('receipt').then(v => {
      setForm(p => ({ ...p, party:'', amount:0, desc:'', number: `RCV-2026-${String(v.length + 1).padStart(3, '0')}` }))
    })
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>💵 {t('receipt_title')}</h1>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">💵 {t('new_receipt_title')}</div></div>
          <div className="form-group"><label className="form-label">{t('lbl_voucher_no')}</label><input className="form-control" value={form.number} onChange={f('number')} style={{ direction:'ltr' }} /></div>
          <div className="form-group">
            <label className="form-label">{t('lbl_received_from')}</label>
            <select className="form-control" value={form.party} onChange={f('party')}>
              <option value="">{t('select_placeholder')}</option>
              {PARTIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">{t('lbl_amount')}</label><input type="number" className="form-control" value={form.amount} onChange={f('amount')} /></div>
          <div className="form-group"><label className="form-label">{t('lbl_date')}</label><input type="date" className="form-control" value={form.date} onChange={f('date')} /></div>
          <div className="form-group">
            <label className="form-label">{t('lbl_desc')}</label>
            <select className="form-control" value={form.method} onChange={f('method')}>
              <option value="cash">{t('pay_cash')}</option>
              <option value="bank">{t('pay_bank')}</option>
              <option value="check">{t('pay_check')}</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">{t('lbl_desc')}</label><textarea className="form-control" rows="2" value={form.desc} onChange={f('desc')} /></div>
          <button className="btn btn-success" style={{ width:'100%' }} onClick={handleSave}>💾 {t('save_voucher_btn')}</button>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">📋 {t('recent_vouchers')}</div></div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>{t('th_number')}</th><th>{t('th_from')}</th><th>{t('th_amount')}</th><th>{t('th_date')}</th></tr></thead>
              <tbody>
                {vouchers.slice(0, 15).map((v, i) => (
                  <tr key={i}>
                    <td style={{ fontSize:'11px', direction:'ltr' }}>{v.number}</td>
                    <td>{v.party}</td>
                    <td style={{ direction:'ltr' }}>${fmt(v.amount)}</td>
                    <td>{v.date}</td>
                  </tr>
                ))}
                {vouchers.length === 0 && <tr><td colSpan="4" style={{ textAlign:'center', padding:'20px', color:'var(--text-muted)' }}>{t('no_vouchers')}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
