import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { useCustomers } from '../hooks/useCustomers'
import Modal from '../components/common/Modal'
import { fmt, fmtInt } from '../utils/format'

const TIER_BADGE = { bronze:'badge-secondary', silver:'badge-info', gold:'badge-warning', platinum:'badge-success' }

const EMPTY_FORM = {
  name: '', phone: '', email: '', dob: '', notes: '',
  whatsapp_opted_in: false,
}

export default function CustomersPage() {
  const { company } = useAuth()
  const { t } = useLang()
  const { customers, loading, loadCustomers, saveCustomer, deleteCustomer } = useCustomers(company?.id)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)

  useEffect(() => { loadCustomers() }, [loadCustomers])

  const filtered = search
    ? customers.filter(c =>
        (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || '').includes(search)
      )
    : customers

  function openNew() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setModal(true)
  }

  function openEdit(c) {
    setForm({
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      dob: c.dob || '',
      notes: c.notes || '',
      whatsapp_opted_in: c.whatsapp_opted_in || false,
    })
    setEditId(c.id)
    setModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    const ok = await saveCustomer(form, editId)
    if (ok) setModal(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const totalPoints = customers.reduce((s, c) => s + (c.loyalty_points || 0), 0)
  const totalSpend = customers.reduce((s, c) => s + parseFloat(c.lifetime_spend || 0), 0)

  const TIER_LABEL = {
    bronze: t('tier_bronze'),
    silver: t('tier_silver'),
    gold: t('tier_gold'),
    platinum: t('tier_platinum'),
  }

  return (
    <div className="page-view">
      <div className="flex-between mb-4">
        <h1 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)' }}>👥 {t('customers_title')}</h1>
        <button className="btn btn-primary" onClick={openNew}>➕ {t('new_customer_btn')}</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{t('cust_total')}</div>
          <div className="stat-value">{fmtInt(customers.length)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('cust_total_points')}</div>
          <div className="stat-value">{fmtInt(totalPoints)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('cust_total_spend')}</div>
          <div className="stat-value" style={{ direction: 'ltr' }}>${fmt(totalSpend)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('cust_whatsapp_subs')}</div>
          <div className="stat-value">{fmtInt(customers.filter(c => c.whatsapp_opted_in).length)}</div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="search-bar no-print">
          <input
            className="form-control"
            placeholder={t('cust_search_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t('lbl_name')}</th>
                <th>{t('lbl_phone')}</th>
                <th>{t('lbl_email')}</th>
                <th>{t('cust_th_points')}</th>
                <th>{t('cust_th_tier')}</th>
                <th>{t('cust_th_visits')}</th>
                <th>{t('cust_th_spend')}</th>
                <th>{t('cust_th_whatsapp')}</th>
                <th className="no-print">{t('th_action')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}><div className="loading-spinner"></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9"><div className="empty-state"><div className="icon">👥</div><p>{t('no_customers')}</p></div></td></tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ direction: 'ltr' }}>{c.phone || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{fmtInt(c.loyalty_points || 0)}</td>
                  <td><span className={`badge ${TIER_BADGE[c.loyalty_tier] || 'badge-secondary'}`}>{TIER_LABEL[c.loyalty_tier] || c.loyalty_tier}</span></td>
                  <td>{fmtInt(c.total_visits || 0)}</td>
                  <td style={{ direction: 'ltr' }}>${fmt(c.lifetime_spend || 0)}</td>
                  <td>{c.whatsapp_opted_in ? '✅' : '—'}</td>
                  <td className="no-print">
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit(c)}>✏️</button>
                    <button className="btn btn-sm btn-danger" style={{ marginRight: '4px' }} onClick={() => deleteCustomer(c.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editId ? `✏️ ${t('edit_customer_title')}` : `➕ ${t('new_customer_title')}`}
        footer={
          <>
            <button className="btn btn-primary" onClick={handleSave}>💾 {t('btn_save')}</button>
            <button className="btn btn-outline" onClick={() => setModal(false)}>{t('btn_cancel')}</button>
          </>
        }
      >
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">{t('lbl_cust_name')} *</label>
            <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_phone')}</label>
            <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="e.g. 03123456" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_email')}</label>
            <input className="form-control" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_dob')}</label>
            <input type="date" className="form-control" value={form.dob} onChange={e => set('dob', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('lbl_notes')}</label>
          <textarea className="form-control" rows="2" value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="whatsapp_opted_in"
            checked={form.whatsapp_opted_in}
            onChange={e => set('whatsapp_opted_in', e.target.checked)}
          />
          <label htmlFor="whatsapp_opted_in" className="form-label" style={{ margin: 0 }}>{t('lbl_whatsapp_consent')}</label>
        </div>
      </Modal>
    </div>
  )
}
