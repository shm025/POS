import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { notify } from '../../utils/notify'
import { useLang } from '../../contexts/LangContext'
import { fmt } from '../../utils/format'

const STATUS_BADGE = { paid:'badge-success', unpaid:'badge-warning', partial:'badge-info', cancelled:'badge-danger' }

export default function InvoicesListPage() {
  const { company } = useAuth()
  const { t } = useLang()
  const [invoices, setInvoices] = useState([])
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const load = async () => {
    if (!company?.id) return
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('company_id', company.id)
      .eq('doc_type', 'invoices')
      .order('created_at', { ascending: false })
    setInvoices(data || [])
  }

  useEffect(() => { load() }, [company?.id])

  const filtered = invoices.filter(i =>
    !search ||
    (i.number||'').toLowerCase().includes(search.toLowerCase()) ||
    (i.customer_name||'').toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id) {
    if (!confirm(t('confirm_delete_invoice'))) return
    const { data: lineItems } = await supabase
      .from('invoice_items')
      .select('item_id, quantity')
      .eq('invoice_id', id)
    if (lineItems?.length) {
      for (const li of lineItems) {
        if (!li.item_id) continue
        const { data: item } = await supabase.from('items').select('stock').eq('id', li.item_id).single()
        if (item) await supabase.from('items').update({ stock: (item.stock || 0) + (li.quantity || 0) }).eq('id', li.item_id)
      }
    }
    await supabase.from('invoices').delete().eq('id', id)
    notify(t('notify_deleted'))
    load()
  }

  async function handlePrint(id) {
    navigate('/invoices/edit/' + id)
    setTimeout(() => window.print(), 800)
  }

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>📋 {t('invoices_list_title')}</h1>
        <button className="btn btn-primary" onClick={() => navigate('/invoices')}>➕ {t('new_invoice_btn')}</button>
      </div>
      <div className="card">
        <div className="search-bar no-print">
          <input className="form-control" placeholder={`🔍 ${t('search_invoices')}`} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>{t('th_number')}</th><th>{t('th_customer')}</th><th>{t('th_date')}</th><th>{t('th_due')}</th><th>{t('th_total')}</th><th>{t('th_status')}</th><th className="no-print">{t('th_action')}</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7"><div className="empty-state"><div className="icon">🧾</div><p>{t('no_invoices_list')}</p></div></td></tr>
              ) : filtered.map(inv => {
                const STATUS_LABEL = { paid: t('status_paid'), unpaid: t('status_unpaid'), partial: t('status_partial'), cancelled: t('status_cancelled') }
                return (
                  <tr key={inv.id}>
                    <td><code>{inv.number}</code></td>
                    <td style={{ fontWeight:600 }}>{inv.customer_name||'-'}</td>
                    <td>{inv.date||'-'}</td>
                    <td>{inv.due_date||'-'}</td>
                    <td style={{ fontWeight:700, color:'var(--primary)', direction:'ltr' }}>${fmt(inv.total)}</td>
                    <td><span className={`badge ${STATUS_BADGE[inv.status]||'badge-secondary'}`}>{STATUS_LABEL[inv.status]||inv.status}</span></td>
                    <td className="no-print">
                      <button className="btn btn-sm btn-outline" onClick={() => navigate('/invoices/edit/' + inv.id)}>✏️ {t('edit_btn')}</button>
                      <button className="btn btn-sm btn-outline" style={{ marginRight:'4px' }} onClick={() => handlePrint(inv.id)}>🖨 {t('print_btn')}</button>
                      <button className="btn btn-sm btn-danger" style={{ marginRight:'4px' }} onClick={() => handleDelete(inv.id)}>🗑</button>
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
