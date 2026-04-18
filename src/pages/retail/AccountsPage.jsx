import { useState, useEffect } from 'react'
import { useAccounts } from '../../hooks/useAccounts'
import { useCustomers } from '../../hooks/useCustomers'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import Modal from '../../components/common/Modal'
import { fmt } from '../../utils/format'

const TYPE_BADGE  = { asset:'badge-info', liability:'badge-danger', equity:'badge-secondary', revenue:'badge-success', expense:'badge-warning' }
const TIER_BADGE  = { bronze:'badge-secondary', silver:'badge-info', gold:'badge-warning', platinum:'badge-success' }

export default function AccountsPage() {
  const { company } = useAuth()
  const { t } = useLang()

  const TYPE_LABEL = { asset: t('type_asset'), liability: t('type_liability'), equity: t('type_equity'), revenue: t('type_revenue'), expense: t('type_expense') }
  const TIER_LABEL = { bronze: t('tier_bronze'), silver: t('tier_silver'), gold: t('tier_gold'), platinum: t('tier_platinum') }

  const { accounts,  loading: accLoad,  loadAccounts,  saveAccount,  deleteAccount  } = useAccounts(company?.id)
  const { customers, loading: custLoad, loadCustomers, saveCustomer, deleteCustomer } = useCustomers(company?.id)
  const { suppliers, loading: suppLoad, loadSuppliers, saveSupplier, deleteSupplier } = useSuppliers(company?.id)

  const [tab,        setTab]        = useState('accounts')
  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editId,     setEditId]     = useState(null)

  const [accForm,  setAccForm]  = useState({ code:'', name:'', type:'asset', balance:0 })
  const [custForm, setCustForm] = useState({ code:'', name:'', phone:'', email:'', dob:'', notes:'', whatsapp_opted_in:false })
  const [suppForm, setSuppForm] = useState({ code:'', name:'', phone:'', email:'', notes:'' })

  useEffect(() => { loadAccounts(); loadCustomers(); loadSuppliers() }, [company?.id])

  function switchTab(t) { setTab(t); setSearch(''); setTypeFilter('') }

  /* ─── Accounts helpers ─── */
  function openNewAcc() {
    setAccForm({ code:'', name:'', type:'asset', balance:0 })
    setEditId(null); setModalOpen(true)
  }
  function openEditAcc(a) {
    setAccForm({ code: a.code||'', name: a.name||'', type: a.type||'asset', balance: a.balance||0 })
    setEditId(a.id); setModalOpen(true)
  }
  async function saveAcc() {
    if (!accForm.code || !accForm.name) return
    await saveAccount(accForm, editId)
    setModalOpen(false)
  }

  /* ─── Customer helpers ─── */
  function nextCustCode() {
    const nums = customers.map(x => parseInt((x.code||'').replace('C-','')) || 0)
    return 'C-' + String(Math.max(0, ...nums) + 1).padStart(3, '0')
  }
  function openNewCust() {
    setCustForm({ code: nextCustCode(), name:'', phone:'', email:'', dob:'', notes:'', whatsapp_opted_in:false })
    setEditId(null); setModalOpen(true)
  }
  function openEditCust(c) {
    setCustForm({ code:c.code||'', name:c.name||'', phone:c.phone||'', email:c.email||'', dob:c.dob||'', notes:c.notes||'', whatsapp_opted_in:c.whatsapp_opted_in||false })
    setEditId(c.id); setModalOpen(true)
  }
  async function saveCust() {
    if (!custForm.name.trim()) return
    await saveCustomer(custForm, editId)
    setModalOpen(false)
  }

  /* ─── Supplier helpers ─── */
  function nextSuppCode() {
    const nums = suppliers.map(x => parseInt((x.code||'').replace('S-','')) || 0)
    return 'S-' + String(Math.max(0, ...nums) + 1).padStart(3, '0')
  }
  function openNewSupp() {
    setSuppForm({ code: nextSuppCode(), name:'', phone:'', email:'', notes:'' })
    setEditId(null); setModalOpen(true)
  }
  function openEditSupp(s) {
    setSuppForm({ code:s.code||'', name:s.name||'', phone:s.phone||'', email:s.email||'', notes:s.notes||'' })
    setEditId(s.id); setModalOpen(true)
  }
  async function saveSupp() {
    if (!suppForm.name.trim()) return
    await saveSupplier(suppForm, editId)
    setModalOpen(false)
  }

  /* ─── Filtered lists ─── */
  const q = search.toLowerCase()
  const filteredAcc  = accounts.filter(a =>
    (!q || (a.name||'').toLowerCase().includes(q) || (a.code||'').includes(q)) &&
    (!typeFilter || a.type === typeFilter)
  )
  const filteredCust = customers.filter(c =>
    !q || (c.name||'').toLowerCase().includes(q) || (c.code||'').toLowerCase().includes(q) || (c.phone||'').includes(q)
  )
  const filteredSupp = suppliers.filter(s =>
    !q || (s.name||'').toLowerCase().includes(q) || (s.code||'').toLowerCase().includes(q) || (s.phone||'').includes(q)
  )

  /* ─── Tab config ─── */
  const tabs = [
    { key:'accounts',  label:`📒 ${t('accounts_title')} (${accounts.length})`  },
    { key:'customers', label:`👤 ${t('customers_tab')} (${customers.length})`   },
    { key:'suppliers', label:`🏭 ${t('suppliers_tab')} (${suppliers.length})`   },
  ]

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>📒 {t('accounts_title')}</h1>
        <button className="btn btn-primary" onClick={tab === 'accounts' ? openNewAcc : tab === 'customers' ? openNewCust : openNewSupp}>
          ➕ {tab === 'accounts' ? t('new_account_btn') : tab === 'customers' ? t('new_customer_btn') : t('new_supplier_btn')}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'8px', borderBottom:'2px solid var(--border-light)', marginBottom:'16px' }}>
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => switchTab(key)} style={{
            padding:'8px 18px', border:'none', cursor:'pointer', fontSize:'13px', background:'transparent',
            borderBottom: tab === key ? '2px solid var(--primary)' : '2px solid transparent',
            color: tab === key ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: tab === key ? 700 : 400, marginBottom:'-2px',
          }}>
            {label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="search-bar no-print" style={{ display:'flex', gap:'8px' }}>
          <input className="form-control" placeholder={`🔍 ${t('search_placeholder')}`} value={search} onChange={e => setSearch(e.target.value)} />
          {tab === 'accounts' && (
            <select className="form-control" style={{ width:'160px' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">{t('all_types')}</option>
              {Object.entries(TYPE_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          )}
        </div>

        {/* ── Accounts table ── */}
        {tab === 'accounts' && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('th_code')}</th><th>{t('th_name')}</th><th>{t('lbl_type')}</th>
                  <th>{t('th_debit')}</th><th>{t('th_credit')}</th><th>{t('th_balance')}</th>
                  <th className="no-print">{t('th_action')}</th>
                </tr>
              </thead>
              <tbody>
                {accLoad ? (
                  <tr><td colSpan="7" style={{ textAlign:'center', padding:'20px' }}><div className="loading-spinner"></div></td></tr>
                ) : filteredAcc.length === 0 ? (
                  <tr><td colSpan="7"><div className="empty-state"><div className="icon">📒</div><p>{t('no_accounts')}</p></div></td></tr>
                ) : filteredAcc.map(a => {
                  const bal = (a.debit||0) - (a.credit||0)
                  return (
                    <tr key={a.id}>
                      <td><code>{a.code}</code></td>
                      <td style={{ fontWeight:600 }}>{a.name}</td>
                      <td><span className={`badge ${TYPE_BADGE[a.type]||'badge-secondary'}`}>{TYPE_LABEL[a.type]||a.type}</span></td>
                      <td style={{ direction:'ltr' }}>{fmt(a.debit||0)}</td>
                      <td style={{ direction:'ltr' }}>{fmt(a.credit||0)}</td>
                      <td style={{ fontWeight:700, color: bal>=0 ? 'var(--success)' : 'var(--danger)', direction:'ltr' }}>
                        {fmt(Math.abs(bal))} {bal>=0?'Dr':'Cr'}
                      </td>
                      <td className="no-print">
                        <button className="btn btn-sm btn-outline" style={{ marginLeft:'4px' }} onClick={() => openEditAcc(a)}>✏️</button>
                        <button className="btn btn-sm btn-danger"  onClick={() => deleteAccount(a.id)}>🗑</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Customers table ── */}
        {tab === 'customers' && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('th_code')}</th><th>{t('lbl_name')}</th><th>{t('lbl_phone')}</th>
                  <th>{t('lbl_email')}</th><th>{t('cust_th_points')}</th><th>{t('cust_th_tier')}</th>
                  <th>{t('cust_th_spend')}</th><th className="no-print">{t('th_action')}</th>
                </tr>
              </thead>
              <tbody>
                {custLoad ? (
                  <tr><td colSpan="8" style={{ textAlign:'center', padding:'20px' }}><div className="loading-spinner"></div></td></tr>
                ) : filteredCust.length === 0 ? (
                  <tr><td colSpan="8"><div className="empty-state"><div className="icon">👤</div><p>{t('no_customers')}</p></div></td></tr>
                ) : filteredCust.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight:700, color:'var(--primary)', direction:'ltr' }}>{c.code||'—'}</td>
                    <td style={{ fontWeight:600 }}>{c.name}</td>
                    <td style={{ direction:'ltr' }}>{c.phone||'—'}</td>
                    <td>{c.email||'—'}</td>
                    <td style={{ fontWeight:700, color:'var(--primary)' }}>{c.loyalty_points||0}</td>
                    <td><span className={`badge ${TIER_BADGE[c.loyalty_tier]||'badge-secondary'}`}>{TIER_LABEL[c.loyalty_tier]||c.loyalty_tier}</span></td>
                    <td style={{ direction:'ltr' }}>${fmt(c.lifetime_spend||0)}</td>
                    <td className="no-print">
                      <button className="btn btn-sm btn-outline" style={{ marginLeft:'4px' }} onClick={() => openEditCust(c)}>✏️</button>
                      <button className="btn btn-sm btn-danger"  onClick={() => deleteCustomer(c.id)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Suppliers table ── */}
        {tab === 'suppliers' && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('th_code')}</th><th>{t('th_name')}</th><th>{t('th_phone')}</th>
                  <th>{t('lbl_email')}</th><th>{t('lbl_notes')}</th>
                  <th className="no-print">{t('th_action')}</th>
                </tr>
              </thead>
              <tbody>
                {suppLoad ? (
                  <tr><td colSpan="6" style={{ textAlign:'center', padding:'20px' }}><div className="loading-spinner"></div></td></tr>
                ) : filteredSupp.length === 0 ? (
                  <tr><td colSpan="6"><div className="empty-state"><div className="icon">🏭</div><p>{t('no_suppliers')}</p></div></td></tr>
                ) : filteredSupp.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight:700, color:'var(--primary)', direction:'ltr' }}>{s.code||'—'}</td>
                    <td style={{ fontWeight:600 }}>{s.name}</td>
                    <td style={{ direction:'ltr' }}>{s.phone||'—'}</td>
                    <td>{s.email||'—'}</td>
                    <td style={{ fontSize:'12px', color:'var(--text-muted)' }}>{s.notes||'—'}</td>
                    <td className="no-print">
                      <button className="btn btn-sm btn-outline" style={{ marginLeft:'4px' }} onClick={() => openEditSupp(s)}>✏️</button>
                      <button className="btn btn-sm btn-danger"  onClick={() => deleteSupplier(s.id)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Accounts modal ── */}
      {tab === 'accounts' && (
        <Modal
          isOpen={modalOpen} onClose={() => setModalOpen(false)}
          title={editId ? `✏️ ${t('edit_account_title')||'Edit Account'}` : `➕ ${t('new_account_title')}`}
          footer={<><button className="btn btn-primary" onClick={saveAcc}>💾 {t('save_btn')}</button><button className="btn btn-outline" onClick={() => setModalOpen(false)}>{t('cancel_btn')}</button></>}
        >
          <div className="grid-2">
            <div className="form-group"><label className="form-label">{t('lbl_acc_code')} *</label><input className="form-control" value={accForm.code} onChange={e => setAccForm(f=>({...f,code:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">{t('lbl_acc_name')} *</label><input className="form-control" value={accForm.name} onChange={e => setAccForm(f=>({...f,name:e.target.value}))} /></div>
            <div className="form-group">
              <label className="form-label">{t('lbl_acc_type')}</label>
              <select className="form-control" value={accForm.type} onChange={e => setAccForm(f=>({...f,type:e.target.value}))}>
                {Object.entries(TYPE_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">{t('lbl_opening_balance')}</label><input type="number" className="form-control" value={accForm.balance} onChange={e => setAccForm(f=>({...f,balance:e.target.value}))} /></div>
          </div>
        </Modal>
      )}

      {/* ── Customer modal ── */}
      {tab === 'customers' && (
        <Modal
          isOpen={modalOpen} onClose={() => setModalOpen(false)}
          title={editId ? `✏️ ${t('edit_customer_title')}` : `➕ ${t('new_customer_title')}`}
          footer={<><button className="btn btn-primary" onClick={saveCust}>💾 {t('btn_save')}</button><button className="btn btn-outline" onClick={() => setModalOpen(false)}>{t('btn_cancel')}</button></>}
        >
          <div className="grid-2">
            <div className="form-group"><label className="form-label">{t('th_code')}</label><input className="form-control" value={custForm.code} onChange={e => setCustForm(f=>({...f,code:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">{t('lbl_cust_name')} *</label><input className="form-control" value={custForm.name} onChange={e => setCustForm(f=>({...f,name:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">{t('lbl_phone')}</label><input className="form-control" value={custForm.phone} onChange={e => setCustForm(f=>({...f,phone:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">{t('lbl_email')}</label><input className="form-control" value={custForm.email} onChange={e => setCustForm(f=>({...f,email:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">{t('lbl_dob')}</label><input type="date" className="form-control" value={custForm.dob} onChange={e => setCustForm(f=>({...f,dob:e.target.value}))} /></div>
          </div>
          <div className="form-group"><label className="form-label">{t('lbl_notes')}</label><textarea className="form-control" rows="2" value={custForm.notes} onChange={e => setCustForm(f=>({...f,notes:e.target.value}))} /></div>
          <div className="form-group" style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <input type="checkbox" id="wa_coa" checked={custForm.whatsapp_opted_in} onChange={e => setCustForm(f=>({...f,whatsapp_opted_in:e.target.checked}))} />
            <label htmlFor="wa_coa" className="form-label" style={{ margin:0 }}>{t('lbl_whatsapp_consent')}</label>
          </div>
        </Modal>
      )}

      {/* ── Supplier modal ── */}
      {tab === 'suppliers' && (
        <Modal
          isOpen={modalOpen} onClose={() => setModalOpen(false)}
          title={editId ? `✏️ ${t('edit_supplier_title')}` : `➕ ${t('new_supplier_title')}`}
          footer={<><button className="btn btn-primary" onClick={saveSupp}>💾 {t('btn_save')}</button><button className="btn btn-outline" onClick={() => setModalOpen(false)}>{t('btn_cancel')}</button></>}
        >
          <div className="grid-2">
            <div className="form-group"><label className="form-label">{t('th_code')}</label><input className="form-control" value={suppForm.code} onChange={e => setSuppForm(f=>({...f,code:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">{t('lbl_cust_name')} *</label><input className="form-control" value={suppForm.name} onChange={e => setSuppForm(f=>({...f,name:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">{t('lbl_phone')}</label><input className="form-control" value={suppForm.phone} onChange={e => setSuppForm(f=>({...f,phone:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">{t('lbl_email')}</label><input className="form-control" value={suppForm.email} onChange={e => setSuppForm(f=>({...f,email:e.target.value}))} /></div>
          </div>
          <div className="form-group"><label className="form-label">{t('lbl_notes')}</label><textarea className="form-control" rows="2" value={suppForm.notes} onChange={e => setSuppForm(f=>({...f,notes:e.target.value}))} /></div>
        </Modal>
      )}
    </div>
  )
}
