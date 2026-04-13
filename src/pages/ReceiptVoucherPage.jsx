import { useState, useEffect } from 'react'
import { useVouchers } from '../hooks/useVouchers'
import { fmt } from '../utils/format'

const PARTIES = ['شركة الأمل التجارية','مؤسسة النجاح','شركة الخليج','محلات السعادة','مورد الإلكترونيات','مورد القرطاسية']

export default function ReceiptVoucherPage() {
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
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>💵 سند قبض</h1>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">💵 سند قبض جديد</div></div>
          <div className="form-group"><label className="form-label">رقم السند</label><input className="form-control" value={form.number} onChange={f('number')} style={{ direction:'ltr' }} /></div>
          <div className="form-group">
            <label className="form-label">المستلم منه</label>
            <select className="form-control" value={form.party} onChange={f('party')}>
              <option value="">-- اختر --</option>
              {PARTIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">المبلغ</label><input type="number" className="form-control" value={form.amount} onChange={f('amount')} /></div>
          <div className="form-group"><label className="form-label">التاريخ</label><input type="date" className="form-control" value={form.date} onChange={f('date')} /></div>
          <div className="form-group">
            <label className="form-label">طريقة الدفع</label>
            <select className="form-control" value={form.method} onChange={f('method')}>
              <option value="cash">نقداً</option>
              <option value="bank">تحويل بنكي</option>
              <option value="check">شيك</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">البيان</label><textarea className="form-control" rows="2" value={form.desc} onChange={f('desc')} /></div>
          <button className="btn btn-success" style={{ width:'100%' }} onClick={handleSave}>💾 حفظ السند</button>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">📋 آخر السندات</div></div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>رقم</th><th>من</th><th>المبلغ</th><th>التاريخ</th></tr></thead>
              <tbody>
                {vouchers.slice(0, 15).map((v, i) => (
                  <tr key={i}>
                    <td style={{ fontSize:'11px', direction:'ltr' }}>{v.number}</td>
                    <td>{v.party}</td>
                    <td style={{ direction:'ltr' }}>${fmt(v.amount)}</td>
                    <td>{v.date}</td>
                  </tr>
                ))}
                {vouchers.length === 0 && <tr><td colSpan="4" style={{ textAlign:'center', padding:'20px', color:'var(--text-muted)' }}>لا توجد سندات</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
