import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { notify } from '../utils/notify'
import { useLang } from '../contexts/LangContext'
import Modal from '../components/common/Modal'

export default function WarehousePage() {
  const { company } = useAuth()
  const { t } = useLang()
  const [warehouses, setWarehouses] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name:'', location:'', manager:'' })

  const load = async () => {
    if (!company?.id) return
    const { data } = await supabase.from('warehouses').select('*').eq('company_id', company.id).order('created_at', { ascending: true })
    setWarehouses(data || [])
  }

  useEffect(() => { load() }, [company?.id])

  async function handleSave() {
    if (!form.name) { notify('أدخل اسم المخزن', 'error'); return }
    await supabase.from('warehouses').insert({ company_id: company.id, ...form })
    notify('تم إضافة المخزن')
    setModalOpen(false)
    setForm({ name:'', location:'', manager:'' })
    load()
  }

  async function handleDelete(id) {
    await supabase.from('warehouses').delete().eq('id', id)
    notify('تم حذف المخزن')
    load()
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>🏭 {t('warehouses_title')}</h1>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>➕ {t('new_warehouse_btn')}</button>
      </div>

      <div className="grid-3">
        {warehouses.length === 0 ? (
          <div className="empty-state"><div className="icon">🏭</div><p>{t('no_warehouses')}</p></div>
        ) : warehouses.map(w => (
          <div key={w.id} className="card" style={{ textAlign:'center' }}>
            <div style={{ fontSize:'32px', marginBottom:'12px' }}>🏭</div>
            <div style={{ fontSize:'16px', fontWeight:700, color:'var(--primary)' }}>{w.name}</div>
            <div style={{ color:'var(--text-muted)', fontSize:'13px', marginTop:'6px' }}>📍 {w.location}</div>
            <div style={{ color:'var(--text-muted)', fontSize:'13px', marginTop:'4px' }}>👤 {w.manager}</div>
            <div style={{ marginTop:'16px', display:'flex', gap:'8px', justifyContent:'center' }}>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(w.id)}>🗑 {t('delete_btn')}</button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`🏭 ${t('new_warehouse_title')}`}
        footer={<><button className="btn btn-primary" onClick={handleSave}>💾 {t('save_btn')}</button><button className="btn btn-outline" onClick={() => setModalOpen(false)}>{t('cancel_btn')}</button></>}
      >
        <div className="form-group"><label className="form-label">{t('lbl_warehouse_name')} *</label><input className="form-control" value={form.name} onChange={f('name')} /></div>
        <div className="form-group"><label className="form-label">{t('lbl_location')}</label><input className="form-control" value={form.location} onChange={f('location')} /></div>
        <div className="form-group"><label className="form-label">{t('lbl_manager')}</label><input className="form-control" value={form.manager} onChange={f('manager')} /></div>
      </Modal>
    </div>
  )
}
