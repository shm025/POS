import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import { useCustomers } from '../../hooks/useCustomers'
import { useSuppliers } from '../../hooks/useSuppliers'
import Modal from '../../components/common/Modal'
import { fmt, fmtInt } from '../../utils/format'

const TIER_BADGE = { bronze:'badge-secondary', silver:'badge-info', gold:'badge-warning', platinum:'badge-success' }

const EMPTY_CUSTOMER = { code:'', name:'', phone:'', email:'', dob:'', notes:'', opening_balance: 0 }
const EMPTY_SUPPLIER  = { code:'', name:'', phone:'', email:'', notes:'', opening_balance: 0 }

function nextCode(list, prefix) {
  const nums = list.map(x => parseInt((x.code || '').replace(prefix, '')) || 0)
  return prefix + String(Math.max(0, ...nums) + 1).padStart(3, '0')
}

export default function CustomersPage() {
  const { company } = useAuth()
  const { t } = useLang()
  const { customers, loading: custLoading, loadCustomers, saveCustomer, deleteCustomer } = useCustomers(company?.id)
  const { suppliers, loading: suppLoading, loadSuppliers, saveSupplier, deleteSupplier } = useSuppliers(company?.id)

  const [tab, setTab]       = useState('customers')
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(EMPTY_CUSTOMER)
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    loadCustomers()
    loadSuppliers()
  }, [company?.id])

  function switchTab(t) { setTab(t); setSearch('') }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function openNewCustomer() { setForm({ ...EMPTY_CUSTOMER, code: nextCode(customers, 'C-') }); setEditId(null); setModal(true) }
  function openEditCustomer(c) {
    setForm({ code:c.code||'', name:c.name||'', phone:c.phone||'', email:c.email||'', dob:c.dob||'', notes:c.notes||'', opening_balance: c.opening_balance || 0 })
    setEditId(c.id); setModal(true)
  }

  function openNewSupplier() { setForm({ ...EMPTY_SUPPLIER, code: nextCode(suppliers, 'S-') }); setEditId(null); setModal(true) }
  function openEditSupplier(s) {
    setForm({ code:s.code||'', name:s.name||'', phone:s.phone||'', email:s.email||'', notes:s.notes||'', opening_balance: s.opening_balance || 0 })
    setEditId(s.id); setModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    if (tab === 'customers') await saveCustomer(form, editId)
    else await saveSupplier(form, editId)
    setModal(false)
  }

  const filteredCustomers = search
    ? customers.filter(c =>
        (c.code||'').toLowerCase().includes(search.toLowerCase()) ||
        (c.name||'').toLowerCase().includes(search.toLowerCase()) ||
        (c.phone||'').includes(search))
    : customers

  const filteredSuppliers = search
    ? suppliers.filter(s =>
        (s.code||'').toLowerCase().includes(search.toLowerCase()) ||
        (s.name||'').toLowerCase().includes(search.toLowerCase()) ||
        (s.phone||'').includes(search))
    : suppliers

  const totalPoints = customers.reduce((s, c) => s + (c.loyalty_points || 0), 0)
  const totalSpend  = customers.reduce((s, c) => s + parseFloat(c.lifetime_spend || 0), 0)
  const whatsappCount = 0 // column removed from DB

  const isCustomers = tab === 'customers'

  const TIER_LABEL = {
    bronze: t('tier_bronze'),
    silver: t('tier_silver'),
    gold: t('tier_gold'),
    platinum: t('tier_platinum'),
  }

  return (
    <div className="page-view">
      <div className="flex-between mb-4">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>👥 {t('customers_title')}</h1>
        <button className="btn btn-primary" onClick={isCustomers ? openNewCustomer : openNewSupplier}>
          ➕ {isCustomers ? t('new_customer_btn') : t('new_supplier_btn')}
        </button>
      </div>

      <div style={{ display:'flex', gap:'8px', marginBottom:'16px', borderBottom:'2px solid var(--border-light)', paddingBottom:'0' }}>
        {[['customers', t('customers_tab')], ['suppliers', t('suppliers_tab')]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            style={{
              padding:'8px 20px',
              border:'none',
              borderBottom: tab === key ? '2px solid var(--primary)' : '2px solid transparent',
              background:'transparent',
              color: tab === key ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: tab === key ? 700 : 400,
              cursor:'pointer',
              fontSize:'14px',
              marginBottom:'-2px',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {isCustomers && (
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
            <div className="stat-value" style={{ direction:'ltr' }}>${fmt(totalSpend)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('cust_whatsapp_subs')}</div>
            <div className="stat-value">{fmtInt(whatsappCount)}</div>
          </div>
        </div>
      )}

      {!isCustomers && (
        <div className="stats-grid" style={{ gridTemplateColumns:'repeat(2,1fr)' }}>
          <div className="stat-card">
            <div className="stat-label">{t('supp_total')}</div>
            <div className="stat-value">{fmtInt(suppliers.length)}</div>
          </div>
        </div>
      )}

      <div className="card mt-4">
        <div className="search-bar no-print">
          <input
            className="form-control"
            placeholder={t('cust_search_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {isCustomers && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('th_code')}</th><th>{t('lbl_name')}</th><th>{t('lbl_phone')}</th><th>{t('lbl_email')}</th>
                  <th>Opening Balance</th>
                  <th>{t('cust_th_points')}</th><th>{t('cust_th_tier')}</th>
                  <th>{t('cust_th_visits')}</th><th>{t('cust_th_spend')}</th>
                  <th className="no-print">{t('th_action')}</th>
                </tr>
              </thead>
              <tbody>
                {custLoading ? (
                  <tr><td colSpan="10" style={{ textAlign:'center', padding:'20px' }}><div className="loading-spinner"></div></td></tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr><td colSpan="9"><div className="empty-state"><div className="icon">👤</div><p>{t('no_customers')}</p></div></td></tr>
                ) : filteredCustomers.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight:700, color:'var(--primary)', direction:'ltr' }}>{c.code || '—'}</td>
                    <td style={{ fontWeight:600 }}>{c.name}</td>
                    <td style={{ direction:'ltr' }}>{c.phone || '-'}</td>
                    <td>{c.email || '-'}</td>
                    <td style={{ direction:'ltr' }}>${fmt(c.opening_balance || 0)}</td>
                    <td style={{ fontWeight:700, color:'var(--primary)' }}>{fmtInt(c.loyalty_points || 0)}</td>
                    <td><span className={`badge ${TIER_BADGE[c.loyalty_tier] || 'badge-secondary'}`}>{TIER_LABEL[c.loyalty_tier] || c.loyalty_tier}</span></td>
                    <td>{fmtInt(c.total_visits || 0)}</td>
                    <td style={{ direction:'ltr' }}>${fmt(c.lifetime_spend || 0)}</td>
                    <td className="no-print">
                      <button className="btn btn-sm btn-outline" onClick={() => openEditCustomer(c)}>✏️</button>
                      <button className="btn btn-sm btn-danger" style={{ marginRight:'4px' }} onClick={() => deleteCustomer(c.id)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isCustomers && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('th_code')}</th><th>{t('th_name')}</th><th>{t('th_phone')}</th><th>{t('lbl_email')}</th>
                  <th>Opening Balance</th><th>{t('lbl_notes')}</th><th className="no-print">{t('th_action')}</th>
                </tr>
              </thead>
              <tbody>
                {suppLoading ? (
                  <tr><td colSpan="6" style={{ textAlign:'center', padding:'20px' }}><div className="loading-spinner"></div></td></tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr><td colSpan="6"><div className="empty-state"><div className="icon">🏭</div><p>{t('no_suppliers')}</p></div></td></tr>
                ) : filteredSuppliers.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight:700, color:'var(--primary)', direction:'ltr' }}>{s.code || '—'}</td>
                    <td style={{ fontWeight:600 }}>{s.name}</td>
                    <td style={{ direction:'ltr' }}>{s.phone || '-'}</td>
                    <td>{s.email || '-'}</td>
                    <td style={{ direction:'ltr' }}>${fmt(s.opening_balance || 0)}</td>
                    <td style={{ color:'var(--text-muted)', fontSize:'12px' }}>{s.notes || '-'}</td>
                    <td className="no-print">
                      <button className="btn btn-sm btn-outline" onClick={() => openEditSupplier(s)}>✏️</button>
                      <button className="btn btn-sm btn-danger" style={{ marginRight:'4px' }} onClick={() => deleteSupplier(s.id)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCustomers && (
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
              <label className="form-label">{t('th_code')} *</label>
              <input className="form-control" value={form.code} onChange={e => set('code', e.target.value)} placeholder="C-001" style={{ fontWeight:700 }} />
            </div>
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
            <div className="form-group">
              <label className="form-label">Opening Balance ($)</label>
              <input type="number" step="0.01" className="form-control" value={form.opening_balance} onChange={e => set('opening_balance', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_notes')}</label>
            <textarea className="form-control" rows="2" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </Modal>
      )}

      {!isCustomers && (
        <Modal
          isOpen={modal}
          onClose={() => setModal(false)}
          title={editId ? `✏️ ${t('edit_supplier_title')}` : `➕ ${t('new_supplier_title')}`}
          footer={
            <>
              <button className="btn btn-primary" onClick={handleSave}>💾 {t('btn_save')}</button>
              <button className="btn btn-outline" onClick={() => setModal(false)}>{t('btn_cancel')}</button>
            </>
          }
        >
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{t('th_code')} *</label>
              <input className="form-control" value={form.code || ''} onChange={e => set('code', e.target.value)} placeholder="S-001" style={{ fontWeight:700 }} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('lbl_cust_name')} *</label>
              <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('lbl_phone')}</label>
              <input className="form-control" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="e.g. 01123456" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('lbl_email')}</label>
              <input className="form-control" value={form.email || ''} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Opening Balance ($)</label>
              <input type="number" step="0.01" className="form-control" value={form.opening_balance || 0} onChange={e => set('opening_balance', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_notes')}</label>
            <textarea className="form-control" rows="2" value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
          </div>
        </Modal>
      )}
    </div>
  )
}
