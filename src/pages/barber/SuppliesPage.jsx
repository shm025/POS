import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import { useSupplies } from '../../hooks/useSupplies'
import Modal from '../../components/common/Modal'
import { fmt, fmtInt } from '../../utils/format'

const today = () => new Date().toISOString().split('T')[0]
const EMPTY_FORM = { name:'', category:'supply', amount:0, date:today(), notes:'' }

export default function SuppliesPage() {
  const { company } = useAuth()
  const { t } = useLang()
  const { supplies, loading, loadSupplies, saveSupply, deleteSupply } = useSupplies(company?.id)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const CAT_LABEL = { supply: t('cat_supply'), tool: t('cat_tool'), product: t('cat_product'), other: t('cat_other') }

  useEffect(() => { loadSupplies() }, [loadSupplies])

  const thisMonth = new Date().toISOString().slice(0, 7)
  const totalMonth = supplies.filter(s => s.date?.startsWith(thisMonth)).reduce((s, r) => s + parseFloat(r.amount || 0), 0)
  const totalAll = supplies.reduce((s, r) => s + parseFloat(r.amount || 0), 0)

  async function handleSave() {
    if (!form.name.trim()) return
    await saveSupply({ ...form, amount: parseFloat(form.amount) || 0 })
    setModal(false)
    setForm(EMPTY_FORM)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="page-view">
      <div className="flex-between mb-4">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>🧴 {t('supplies_title')}</h1>
        <button className="btn btn-primary" onClick={() => { setForm({ ...EMPTY_FORM, date: today() }); setModal(true) }}>➕ {t('new_supply_btn')}</button>
      </div>

      <div className="stats-grid mb-4" id="supplies-stats">
        <div className="stat-card"><div className="stat-label">{t('month_supplies')}</div><div className="stat-value" style={{ direction:'ltr' }}>${fmt(totalMonth)}</div></div>
        <div className="stat-card"><div className="stat-label">{t('total_supplies')}</div><div className="stat-value" style={{ direction:'ltr' }}>${fmt(totalAll)}</div></div>
        <div className="stat-card"><div className="stat-label">{t('supplies_count')}</div><div className="stat-value">{fmtInt(supplies.length)}</div></div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>{t('th_name')}</th><th>{t('th_supply_cat')}</th><th>{t('th_amount')}</th><th>{t('th_date')}</th><th>{t('lbl_notes_opt')}</th><th className="no-print">{t('th_action')}</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign:'center', padding:'20px' }}><div className="loading-spinner"></div></td></tr>
              ) : supplies.length === 0 ? (
                <tr><td colSpan="6"><div className="empty-state"><div className="icon">🧴</div><p>{t('no_supplies')}</p></div></td></tr>
              ) : supplies.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight:600 }}>{s.name}</td>
                  <td><span className="badge badge-info">{CAT_LABEL[s.category]||s.category}</span></td>
                  <td style={{ fontWeight:700, direction:'ltr' }}>${fmt(s.amount)}</td>
                  <td>{s.date||'-'}</td>
                  <td>{s.notes||'-'}</td>
                  <td className="no-print">
                    <button className="btn btn-sm btn-danger" onClick={() => deleteSupply(s.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={`🧴 ${t('new_supply_title')}`} footer={
        <>
          <button className="btn btn-primary" onClick={handleSave}>💾 {t('save_btn')}</button>
          <button className="btn btn-outline" onClick={() => setModal(false)}>{t('cancel_btn')}</button>
        </>
      }>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">{t('lbl_supply_name')}</label>
            <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_supply_cat')}</label>
            <select className="form-control" value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="supply">{t('cat_supply')}</option>
              <option value="tool">{t('cat_tool')}</option>
              <option value="product">{t('cat_product')}</option>
              <option value="other">{t('cat_other')}</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_supply_amount')}</label>
            <input type="number" className="form-control" value={form.amount} onChange={e => set('amount', e.target.value)} step="0.01" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_date')}</label>
            <input type="date" className="form-control" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('lbl_notes_opt')}</label>
          <textarea className="form-control" rows="2" value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
