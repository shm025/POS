import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import { supabase } from '../../lib/supabase'
import { notify } from '../../utils/notify'
import { fmt } from '../../utils/format'

const STATUS_BADGE = {
  pending:    'badge-warning',
  confirmed:  'badge-info',
  processing: 'badge-secondary',
  delivered:  'badge-success',
  cancelled:  'badge-danger',
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'delivered', 'cancelled']

const TABS = [
  { key: 'orders',    label: 'Sales Orders',    newRoute: '/orders',    editRoute: id => `/orders/edit/${id}`,    convertType: 'purchases', convertPrefix: 'PUR' },
  { key: 'purchases', label: 'Purchase Orders', newRoute: '/purchases', editRoute: id => `/purchases/edit/${id}`, convertType: 'purchases', convertPrefix: 'PUR' },
]

export default function OrdersRegisterPage() {
  const { company } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()

  const [tab, setTab]                   = useState('orders')
  const [orders, setOrders]             = useState([])
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const STATUS_LABEL = {
    pending:    t('order_status_pending')    || 'Pending',
    confirmed:  t('order_status_confirmed')  || 'Confirmed',
    processing: t('order_status_processing') || 'Processing',
    delivered:  t('order_status_delivered')  || 'Delivered',
    cancelled:  t('order_status_cancelled')  || 'Cancelled',
  }

  const currentTab = TABS.find(t => t.key === tab)

  const load = useCallback(async () => {
    if (!company?.id) return
    const { data } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('company_id', company.id)
      .eq('doc_type', tab)
      .order('created_at', { ascending: false })
    setOrders(data || [])
  }, [company?.id, tab])

  useEffect(() => { load() }, [load])

  /* ── Delete ── */
  async function handleDelete(id) {
    if (!confirm(t('confirm_delete_invoice') || 'Delete this order?')) return
    await supabase.from('invoice_items').delete().eq('invoice_id', id)
    await supabase.from('invoices').delete().eq('id', id)
    notify(t('notify_deleted') || 'Deleted')
    load()
  }

  /* ── Convert to Invoice ── */
  async function convertToInvoice(order) {
    const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true })
      .eq('company_id', company.id).eq('doc_type', currentTab.convertType)
    const number = `${currentTab.convertPrefix}-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`

    const { data: inv, error: invErr } = await supabase.from('invoices').insert({
      company_id: company.id,
      doc_type: currentTab.convertType,
      number,
      customer_name: order.customer_name,
      date: new Date().toISOString().split('T')[0],
      status: 'unpaid',
      subtotal: order.total,
      discount: 0,
      tax: 0,
      total: order.total,
    }).select().single()

    if (invErr || !inv) { notify(invErr?.message || 'Failed to create invoice', 'error'); return }

    const lines = (order.invoice_items || []).filter(i => i.item_name).map(i => ({
      invoice_id: inv.id,
      company_id: company.id,
      item_name: i.item_name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      cost_price: 0,
      discount: 0,
      total: i.total,
    }))
    if (lines.length) await supabase.from('invoice_items').insert(lines)

    await supabase.from('invoices').update({ status: 'delivered' }).eq('id', order.id)
    notify(`✅ ${t('notify_saved') || 'Converted'} → ${number}`)
    load()
  }

  /* ── Filter ── */
  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      (o.number || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_name || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="page-view">
      {/* Header */}
      <div className="flex-between mb-4">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>📑 {t('orders_register_title') || 'Orders Register'}</h1>
        <button className="btn btn-primary" onClick={() => navigate(currentTab.newRoute)}>➕ New Order</button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'0', marginBottom:'12px', borderBottom:'2px solid var(--border-light)' }}>
        {TABS.map(tb => (
          <button
            key={tb.key}
            onClick={() => { setTab(tb.key); setStatusFilter('all'); setSearch('') }}
            style={{
              padding:'8px 20px', border:'none', background:'none', cursor:'pointer',
              fontWeight: tab === tb.key ? 700 : 400,
              color: tab === tb.key ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: tab === tb.key ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom:'-2px', fontSize:'14px',
            }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom:'12px', padding:'10px 16px' }}>
        <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'center' }}>
          <input className="form-control" style={{ maxWidth:'260px' }}
            placeholder={`🔍 ${t('search_orders') || 'Search...'}`}
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-control" style={{ maxWidth:'180px' }}
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">{t('all_statuses') || 'All Statuses'}</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t('th_number') || '#'}</th>
                <th>{tab === 'orders' ? (t('th_customer') || 'Customer') : (t('th_supplier') || 'Supplier')}</th>
                <th>{t('th_date') || 'Date'}</th>
                <th>{t('expected_delivery') || 'Due'}</th>
                <th>{t('th_total') || 'Total'}</th>
                <th>{t('th_status') || 'Status'}</th>
                <th>{t('th_action') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7"><div className="empty-state"><div className="icon">📑</div><p>{t('no_orders') || 'No orders found'}</p></div></td></tr>
              ) : filtered.map(o => (
                <tr key={o.id}>
                  <td><code>{o.number}</code></td>
                  <td style={{ fontWeight:600 }}>{o.customer_name}</td>
                  <td>{o.date || '—'}</td>
                  <td>{o.due_date || '—'}</td>
                  <td style={{ fontWeight:700, color:'var(--primary)', direction:'ltr' }}>${fmt(o.total)}</td>
                  <td>
                    <select className="form-control" style={{ fontSize:'11px', padding:'2px 6px', minWidth:'110px' }}
                      value={o.status}
                      onChange={async e => {
                        await supabase.from('invoices').update({ status: e.target.value }).eq('id', o.id)
                        load()
                      }}>
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                      <button className="btn btn-sm btn-outline" onClick={() => navigate(currentTab.editRoute(o.id))}>✏️</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(o.id)}>🗑</button>
                      <button className="btn btn-sm btn-success" style={{ fontSize:'10px' }} onClick={() => convertToInvoice(o)}>🧾 {t('convert_to_invoice') || 'Convert'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
