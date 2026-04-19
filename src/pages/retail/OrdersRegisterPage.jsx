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

const EMPTY_FORM = {
  customer_name: '', customer_phone: '', date: new Date().toISOString().split('T')[0],
  expected_delivery: '', notes: '', status: 'pending',
}
const EMPTY_ITEM = { item_name: '', item_code: '', quantity: 1, unit_price: 0, total: 0 }

export default function OrdersRegisterPage() {
  const { company } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()

  const [orders, setOrders]       = useState([])
  const [items, setItems]         = useState([])        // company items for autocomplete
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal]         = useState(false)
  const [editId, setEditId]       = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [orderItems, setOrderItems] = useState([{ ...EMPTY_ITEM }])
  const [saving, setSaving]       = useState(false)

  const STATUS_LABEL = {
    pending:    t('order_status_pending')    || 'Pending',
    confirmed:  t('order_status_confirmed')  || 'Confirmed',
    processing: t('order_status_processing') || 'Processing',
    delivered:  t('order_status_delivered')  || 'Delivered',
    cancelled:  t('order_status_cancelled')  || 'Cancelled',
  }

  const load = useCallback(async () => {
    if (!company?.id) return
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
    setOrders(data || [])
  }, [company?.id])

  const loadItems = useCallback(async () => {
    if (!company?.id) return
    const { data } = await supabase.from('items').select('id,name,code,selling_price')
      .eq('company_id', company.id).eq('is_active', true)
    setItems(data || [])
  }, [company?.id])

  useEffect(() => { load(); loadItems() }, [load, loadItems])

  /* ── Helpers ── */
  function openNew() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setOrderItems([{ ...EMPTY_ITEM }])
    setModal(true)
  }

  function openEdit(order) {
    setEditId(order.id)
    setForm({
      customer_name: order.customer_name || '',
      customer_phone: order.customer_phone || '',
      date: order.date || '',
      expected_delivery: order.expected_delivery || '',
      notes: order.notes || '',
      status: order.status || 'pending',
    })
    setOrderItems(
      order.order_items?.length
        ? order.order_items.map(i => ({
            id: i.id,
            item_name: i.item_name || '',
            item_code: i.item_code || '',
            quantity: i.quantity,
            unit_price: i.unit_price,
            total: i.total,
          }))
        : [{ ...EMPTY_ITEM }]
    )
    setModal(true)
  }

  function updateItem(idx, field, val) {
    setOrderItems(prev => prev.map((it, i) => {
      if (i !== idx) return it
      const updated = { ...it, [field]: val }
      if (field === 'quantity' || field === 'unit_price') {
        updated.total = (parseFloat(updated.quantity) || 0) * (parseFloat(updated.unit_price) || 0)
      }
      return updated
    }))
  }

  function selectItemFromList(idx, item) {
    setOrderItems(prev => prev.map((it, i) => {
      if (i !== idx) return it
      const qty = parseFloat(it.quantity) || 1
      return { ...it, item_name: item.name, item_code: item.code || '', unit_price: item.selling_price || 0, total: qty * (item.selling_price || 0) }
    }))
  }

  function addItemRow() { setOrderItems(prev => [...prev, { ...EMPTY_ITEM }]) }
  function removeItemRow(idx) { setOrderItems(prev => prev.filter((_, i) => i !== idx)) }

  const orderTotal = orderItems.reduce((s, i) => s + (parseFloat(i.total) || 0), 0)

  /* ── Generate order number ── */
  async function genNumber() {
    const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('company_id', company.id)
    return `ORD-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`
  }

  /* ── Save ── */
  async function handleSave() {
    if (!form.customer_name.trim()) { notify(t('doc_party_required') || 'Customer name required', 'error'); return }
    setSaving(true)

    const payload = {
      company_id: company.id,
      customer_name: form.customer_name,
      customer_phone: form.customer_phone || null,
      date: form.date || null,
      expected_delivery: form.expected_delivery || null,
      notes: form.notes || null,
      status: form.status,
      total: orderTotal,
    }

    let orderId = editId

    if (editId) {
      const { error } = await supabase.from('orders').update(payload).eq('id', editId)
      if (error) { notify(error.message, 'error'); setSaving(false); return }
      await supabase.from('order_items').delete().eq('order_id', editId)
    } else {
      payload.order_number = await genNumber()
      const { data, error } = await supabase.from('orders').insert(payload).select().single()
      if (error || !data) { notify(error?.message || 'Save failed', 'error'); setSaving(false); return }
      orderId = data.id
    }

    const lines = orderItems.filter(i => i.item_name).map(i => ({
      order_id: orderId,
      company_id: company.id,
      item_name: i.item_name,
      item_code: i.item_code || null,
      quantity: parseFloat(i.quantity) || 0,
      unit_price: parseFloat(i.unit_price) || 0,
      total: parseFloat(i.total) || 0,
    }))
    if (lines.length) await supabase.from('order_items').insert(lines)

    notify(t('notify_saved') || 'Saved')
    setSaving(false)
    setModal(false)
    load()
  }

  /* ── Delete ── */
  async function handleDelete(id) {
    if (!confirm(t('confirm_delete_invoice') || 'Delete this order?')) return
    await supabase.from('order_items').delete().eq('order_id', id)
    await supabase.from('orders').delete().eq('id', id)
    notify(t('notify_deleted') || 'Deleted')
    load()
  }

  /* ── Convert to Invoice ── */
  async function convertToInvoice(order) {
    const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true })
      .eq('company_id', company.id).eq('doc_type', 'invoices')
    const number = `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`

    const { data: inv, error: invErr } = await supabase.from('invoices').insert({
      company_id: company.id,
      doc_type: 'invoices',
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

    const lines = (order.order_items || []).filter(i => i.item_name).map(i => ({
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

    await supabase.from('orders').update({ status: 'delivered' }).eq('id', order.id)
    notify(`✅ ${t('notify_saved') || 'Converted to invoice'} ${number}`)
    load()
  }

  /* ── Filter ── */
  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      (o.order_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_name || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="page-view">
      {/* Header */}
      <div className="flex-between mb-4">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>📑 {t('orders_register_title') || 'سجل الطلبيات'}</h1>
        <button className="btn btn-primary" onClick={() => navigate('/orders')}>➕ New Order</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom:'12px', padding:'10px 16px' }}>
        <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'center' }}>
          <input className="form-control" style={{ maxWidth:'260px' }}
            placeholder={`🔍 ${t('search_orders') || 'بحث...'}`}
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-control" style={{ maxWidth:'180px' }}
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">{t('all_statuses') || 'كل الحالات'}</option>
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
                <th>{t('th_customer') || 'العميل'}</th>
                <th>{t('lbl_phone') || 'الهاتف'}</th>
                <th>{t('th_date') || 'التاريخ'}</th>
                <th>{t('expected_delivery') || 'التسليم'}</th>
                <th>{t('th_total') || 'الإجمالي'}</th>
                <th>{t('th_status') || 'الحالة'}</th>
                <th>{t('th_action') || 'إجراء'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="8"><div className="empty-state"><div className="icon">📑</div><p>{t('no_orders') || 'لا توجد طلبيات'}</p></div></td></tr>
              ) : filtered.map(o => (
                <tr key={o.id}>
                  <td><code>{o.order_number}</code></td>
                  <td style={{ fontWeight:600 }}>{o.customer_name}</td>
                  <td style={{ direction:'ltr', fontSize:'12px' }}>{o.customer_phone || '—'}</td>
                  <td>{o.date || '—'}</td>
                  <td>{o.expected_delivery || '—'}</td>
                  <td style={{ fontWeight:700, color:'var(--primary)', direction:'ltr' }}>${fmt(o.total)}</td>
                  <td>
                    <select className="form-control" style={{ fontSize:'11px', padding:'2px 6px', minWidth:'110px' }}
                      value={o.status}
                      onChange={async e => {
                        await supabase.from('orders').update({ status: e.target.value }).eq('id', o.id)
                        load()
                      }}>
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(o)}>✏️</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(o.id)}>🗑</button>
                      <button className="btn btn-sm btn-success" style={{ fontSize:'10px' }} onClick={() => convertToInvoice(o)}>🧾 {t('convert_to_invoice') || 'تحويل'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="modal" style={{ maxWidth:'780px', width:'95%', maxHeight:'90vh', overflowY:'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? (t('edit_order') || 'تعديل الطلبية') : (t('new_order_btn') || 'طلبية جديدة')}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">

              {/* Customer info */}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{t('th_customer') || 'العميل'} *</label>
                  <input className="form-control" value={form.customer_name}
                    onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('lbl_phone') || 'الهاتف'}</label>
                  <input className="form-control" value={form.customer_phone}
                    onChange={e => setForm(p => ({ ...p, customer_phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('lbl_date') || 'التاريخ'}</label>
                  <input type="date" className="form-control" value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('expected_delivery') || 'تاريخ التسليم'}</label>
                  <input type="date" className="form-control" value={form.expected_delivery}
                    onChange={e => setForm(p => ({ ...p, expected_delivery: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('th_status') || 'الحالة'}</label>
                  <select className="form-control" value={form.status}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('doc_notes_label') || 'ملاحظات'}</label>
                  <input className="form-control" value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>

              {/* Items */}
              <div style={{ marginTop:'16px' }}>
                <div className="flex-between mb-2">
                  <label className="form-label" style={{ margin:0 }}>📦 {t('doc_items_title') || 'الأصناف'}</label>
                  <button className="btn btn-sm btn-primary" onClick={addItemRow}>➕</button>
                </div>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'var(--bg-panel)', fontSize:'12px' }}>
                      <th style={{ padding:'6px', border:'1px solid var(--border-light)', width:'30%' }}>الصنف</th>
                      <th style={{ padding:'6px', border:'1px solid var(--border-light)', width:'15%' }}>الكود</th>
                      <th style={{ padding:'6px', border:'1px solid var(--border-light)', width:'15%' }}>الكمية</th>
                      <th style={{ padding:'6px', border:'1px solid var(--border-light)', width:'18%' }}>السعر</th>
                      <th style={{ padding:'6px', border:'1px solid var(--border-light)', width:'15%' }}>الإجمالي</th>
                      <th style={{ padding:'6px', border:'1px solid var(--border-light)', width:'7%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((it, idx) => (
                      <tr key={idx}>
                        <td style={{ padding:'3px', border:'1px solid var(--border-light)' }}>
                          <input className="form-control" style={{ fontSize:'12px' }} value={it.item_name}
                            list={`items-list-${idx}`}
                            onChange={e => {
                              const found = items.find(i => i.name === e.target.value)
                              if (found) selectItemFromList(idx, found)
                              else updateItem(idx, 'item_name', e.target.value)
                            }} />
                          <datalist id={`items-list-${idx}`}>
                            {items.map(i => <option key={i.id} value={i.name} />)}
                          </datalist>
                        </td>
                        <td style={{ padding:'3px', border:'1px solid var(--border-light)' }}>
                          <input className="form-control" style={{ fontSize:'12px' }} value={it.item_code}
                            onChange={e => updateItem(idx, 'item_code', e.target.value)} />
                        </td>
                        <td style={{ padding:'3px', border:'1px solid var(--border-light)' }}>
                          <input type="number" className="form-control" style={{ fontSize:'12px' }} value={it.quantity} min="1"
                            onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                        </td>
                        <td style={{ padding:'3px', border:'1px solid var(--border-light)' }}>
                          <input type="number" className="form-control" style={{ fontSize:'12px' }} value={it.unit_price} step="0.01"
                            onChange={e => updateItem(idx, 'unit_price', e.target.value)} />
                        </td>
                        <td style={{ padding:'6px', border:'1px solid var(--border-light)', fontWeight:700, direction:'ltr', textAlign:'right' }}>
                          ${fmt(it.total)}
                        </td>
                        <td style={{ padding:'3px', border:'1px solid var(--border-light)', textAlign:'center' }}>
                          <button className="btn btn-sm btn-danger" onClick={() => removeItemRow(idx)}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign:'left', marginTop:'8px', fontSize:'16px', fontWeight:900, color:'var(--primary)', direction:'ltr' }}>
                  Total: ${fmt(orderTotal)}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(false)}>{t('cancel_btn') || 'إلغاء'}</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '...' : `💾 ${t('save_btn') || 'حفظ'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
