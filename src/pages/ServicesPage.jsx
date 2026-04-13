import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { useServices } from '../hooks/useServices'
import Modal from '../components/common/Modal'
import { fmt, fmtInt } from '../utils/format'

const EMPTY_FORM = { name:'', base_price:0, junior_price:0, senior_price:0, master_price:0, duration_minutes:30 }

export default function ServicesPage() {
  const { company } = useAuth()
  const { t } = useLang()
  const { services, loading, loadServices, saveService, deleteService } = useServices(company?.id)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)

  useEffect(() => { loadServices() }, [company?.id])

  function openNew() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setModal(true)
  }

  function openEdit(s) {
    setForm({ name:s.name, base_price:s.base_price, junior_price:s.junior_price, senior_price:s.senior_price, master_price:s.master_price, duration_minutes:s.duration_minutes })
    setEditId(s.id)
    setModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    await saveService({ ...form, base_price: parseFloat(form.base_price)||0, junior_price: parseFloat(form.junior_price)||0, senior_price: parseFloat(form.senior_price)||0, master_price: parseFloat(form.master_price)||0, duration_minutes: parseInt(form.duration_minutes)||30 }, editId)
    setModal(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="page-view">
      <div className="flex-between mb-4">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>✂️ {t('services_title')}</h1>
        <button className="btn btn-primary" onClick={openNew}>➕ {t('new_service_btn')}</button>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>{t('th_service')}</th><th>{t('th_base_price')}</th><th>Junior</th><th>Senior</th><th>Master</th><th>{t('th_duration')}</th><th>{t('th_status')}</th><th className="no-print">{t('th_action')}</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign:'center', padding:'20px' }}><div className="loading-spinner"></div></td></tr>
              ) : services.length === 0 ? (
                <tr><td colSpan="8"><div className="empty-state"><div className="icon">✂️</div><p>{t('no_services')}</p><span>{t('no_services_hint')}</span></div></td></tr>
              ) : services.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight:600 }}>{s.name}</td>
                  <td style={{ direction:'ltr' }}>${fmt(s.base_price)}</td>
                  <td style={{ direction:'ltr' }}>${fmt(s.junior_price)}</td>
                  <td style={{ direction:'ltr' }}>${fmt(s.senior_price)}</td>
                  <td style={{ direction:'ltr' }}>${fmt(s.master_price)}</td>
                  <td>{fmtInt(s.duration_minutes)} {t('min_abbr')}</td>
                  <td><span className={`badge ${s.active ? 'badge-success' : 'badge-danger'}`}>{s.active ? t('svc_active') : t('svc_inactive')}</span></td>
                  <td className="no-print">
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit(s)}>✏️</button>
                    <button className="btn btn-sm btn-danger" style={{ marginRight:'4px' }} onClick={() => deleteService(s.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? `✏️ ${t('edit_service_title')}` : `✂️ ${t('new_service_title')}`} footer={
        <>
          <button className="btn btn-primary" onClick={handleSave}>💾 {t('save_btn')}</button>
          <button className="btn btn-outline" onClick={() => setModal(false)}>{t('cancel_btn')}</button>
        </>
      }>
        <div className="form-group">
          <label className="form-label">{t('lbl_service_name')}</label>
          <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} placeholder={t('service_name_placeholder')} />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">{t('lbl_base_price')}</label>
            <input type="number" className="form-control" value={form.base_price} onChange={e => set('base_price', e.target.value)} step="0.01" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_duration_min')}</label>
            <input type="number" className="form-control" value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_junior_price')}</label>
            <input type="number" className="form-control" value={form.junior_price} onChange={e => set('junior_price', e.target.value)} step="0.01" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_senior_price')}</label>
            <input type="number" className="form-control" value={form.senior_price} onChange={e => set('senior_price', e.target.value)} step="0.01" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_master_price')}</label>
            <input type="number" className="form-control" value={form.master_price} onChange={e => set('master_price', e.target.value)} step="0.01" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
