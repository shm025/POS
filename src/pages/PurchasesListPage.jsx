import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { dbGetAll, dbDelete } from '../lib/db'
import { notify } from '../utils/notify'
import { useLang } from '../contexts/LangContext'
import { fmt } from '../utils/format'

const STATUS_BADGE = { paid:'badge-success', unpaid:'badge-warning', partial:'badge-info', cancelled:'badge-danger' }

export default function PurchasesListPage() {
  const { t } = useLang()
  const [purchases, setPurchases] = useState([])
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const load = () => dbGetAll('purchases').then(data => setPurchases([...data].reverse()))
  useEffect(() => { load() }, [])

  const filtered = purchases.filter(p =>
    !search || (p.number||'').toLowerCase().includes(search.toLowerCase()) || (p.party||'').toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id) {
    if (!confirm(t('confirm_delete_invoice'))) return
    await dbDelete('purchases', id)
    notify('تم الحذف')
    load()
  }

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>🛒 {t('purchases_list_title')}</h1>
        <button className="btn btn-primary" onClick={() => navigate('/purchases')}>➕ {t('new_purchase_btn')}</button>
      </div>
      <div className="card">
        <div className="search-bar no-print">
          <input className="form-control" placeholder={`🔍 ${t('search_purchases')}`} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>{t('th_number')}</th><th>{t('th_supplier')}</th><th>{t('th_date')}</th><th>{t('th_due')}</th><th>{t('th_total')}</th><th>{t('th_status')}</th><th className="no-print">{t('th_action')}</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7"><div className="empty-state"><div className="icon">🛒</div><p>{t('no_purchases')}</p></div></td></tr>
              ) : filtered.map(p => {
                const STATUS_LABEL = { paid: t('status_paid'), unpaid: t('status_unpaid'), partial: t('status_partial'), cancelled: t('status_cancelled') }
                return (
                  <tr key={p.id}>
                    <td><code>{p.number}</code></td>
                    <td style={{ fontWeight:600 }}>{p.party||'-'}</td>
                    <td>{p.date||'-'}</td>
                    <td>{p.dueDate||'-'}</td>
                    <td style={{ fontWeight:700, color:'var(--primary)', direction:'ltr' }}>${fmt(p.total)}</td>
                    <td><span className={`badge ${STATUS_BADGE[p.status]||'badge-secondary'}`}>{STATUS_LABEL[p.status]||p.status}</span></td>
                    <td className="no-print">
                      <button className="btn btn-sm btn-outline" onClick={() => navigate('/purchases/edit/' + p.id)}>✏️ {t('edit_btn')}</button>
                      <button className="btn btn-sm btn-danger" style={{ marginRight:'4px' }} onClick={() => handleDelete(p.id)}>🗑</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
