import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useItems } from '../../hooks/useItems'
import { useStockMovements } from '../../hooks/useStockMovements'
import { useLang } from '../../contexts/LangContext'
import { fmt, fmtInt } from '../../utils/format'
import { exportStockCSV } from '../../utils/csv'
import Modal from '../../components/common/Modal'

const MOVE_TYPE_KEY = {
  sale: 'move_sale', return: 'move_return', receive: 'move_receive', adjust: 'move_adjust',
  transfer_in: 'move_transfer_in', transfer_out: 'move_transfer_out', waste: 'move_waste',
}
const MOVE_TYPE_COLOR = {
  sale: 'var(--danger)', return: 'var(--success)', receive: 'var(--success)',
  adjust: 'var(--warning)', transfer_in: 'var(--success)', transfer_out: 'var(--danger)', waste: 'var(--danger)',
}

export default function StockReportPage() {
  const { company, profile } = useAuth()
  const { t } = useLang()
  const { items, loadItems } = useItems(company?.id)
  const { movements, loading: movLoading, loadMovements, adjustStock } = useStockMovements(company?.id)

  const [movItem, setMovItem] = useState(null) // item to show movements for
  const [adjModal, setAdjModal] = useState(false)
  const [adjForm, setAdjForm] = useState({ item_id: '', qty: 0, reason: '' })
  const [filter, setFilter] = useState('')

  useEffect(() => { loadItems() }, [company?.id])

  useEffect(() => {
    if (movItem) loadMovements({ itemId: movItem.id })
  }, [movItem])

  const filtered = filter
    ? items.filter(i => (i.name || '').toLowerCase().includes(filter.toLowerCase()) || (i.barcode || '').includes(filter) || (i.code || '').includes(filter))
    : items

  const totalValue = items.reduce((s, i) => s + (i.stock || 0) * (i.cost_price || 0), 0)
  const lowCount = items.filter(i => (i.stock || 0) <= (i.reorder_point || 0)).length
  const deadStock = items.filter(i => {
    if (!i.last_sold_at) return true
    const daysSince = (Date.now() - new Date(i.last_sold_at).getTime()) / (1000 * 60 * 60 * 24)
    return daysSince > 60
  }).length

  function openAdj(item) {
    setAdjForm({ item_id: item.id, item_name: item.name, qty: 0, reason: '' })
    setAdjModal(true)
  }

  async function handleAdjust() {
    if (!adjForm.qty || adjForm.qty === 0) return
    await adjustStock({
      itemId: adjForm.item_id,
      qty: parseInt(adjForm.qty),
      reason: adjForm.reason,
      userId: profile?.id,
    })
    setAdjModal(false)
    loadItems()
  }

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)' }}>📈 {t('stock_report_title')}</h1>
        <button className="btn btn-outline" onClick={() => exportStockCSV(items)}>⬇ {t('export_btn')}</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">{t('total_items_label')}</div><div className="stat-value">{fmtInt(items.length)}</div></div>
        <div className="stat-card"><div className="stat-label">{t('total_units_label')}</div><div className="stat-value">{fmtInt(items.reduce((s, i) => s + (i.stock || 0), 0))}</div></div>
        <div className="stat-card"><div className="stat-label">{t('stock_value_label')}</div><div className="stat-value" style={{ fontSize: '18px', direction: 'ltr' }}>${fmt(totalValue)}</div></div>
        <div className="stat-card"><div className="stat-label">{t('low_stock_label')}</div><div className="stat-value" style={{ color: 'var(--danger)' }}>{fmtInt(lowCount)}</div></div>
        <div className="stat-card"><div className="stat-label">{t('dead_stock_label')}</div><div className="stat-value" style={{ color: 'var(--warning)' }}>{fmtInt(deadStock)}</div></div>
      </div>

      <div className="card mt-4">
        <div className="search-bar no-print mb-2">
          <input className="form-control" placeholder={`🔍 ${t('stock_filter_placeholder')}...`} value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t('th_code')}</th><th>{t('th_name')}</th><th>{t('th_barcode')}</th>
                <th>{t('th_cost')}</th><th>{t('th_price')}</th><th>{t('th_margin')}</th>
                <th>{t('th_current_stock')}</th><th>{t('th_reorder')}</th>
                <th>{t('th_value')}</th><th>{t('th_status')}</th>
                <th className="no-print">{t('th_action')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => {
                const low = (i.stock || 0) <= (i.reorder_point || 0)
                const margin = i.selling_price > 0
                  ? (((i.selling_price - i.cost_price) / i.selling_price) * 100).toFixed(1)
                  : 0
                const isDeadStock = i.last_sold_at
                  ? (Date.now() - new Date(i.last_sold_at).getTime()) / (1000 * 60 * 60 * 24) > 60
                  : true
                return (
                  <tr key={i.id}>
                    <td><code>{i.code}</code></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{i.name}</div>
                      {i.brand && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{i.brand}</div>}
                    </td>
                    <td style={{ direction: 'ltr', fontSize: '12px' }}>{i.barcode || '—'}</td>
                    <td style={{ direction: 'ltr' }}>${fmt(i.cost_price)}</td>
                    <td style={{ direction: 'ltr', color: 'var(--success)' }}>${fmt(i.selling_price)}</td>
                    <td style={{ fontWeight: 600 }}>{margin}%</td>
                    <td style={{ fontWeight: 700, color: low ? 'var(--danger)' : 'inherit' }}>
                      {fmtInt(i.stock)} {i.unit}
                    </td>
                    <td>{fmtInt(i.reorder_point)}</td>
                    <td style={{ direction: 'ltr' }}>${fmt((i.stock || 0) * (i.cost_price || 0))}</td>
                    <td>
                      <span className={`badge ${low ? 'badge-danger' : 'badge-success'}`}>{low ? t('status_low') : t('status_ok')}</span>
                      {isDeadStock && <span className="badge badge-warning" style={{ marginRight: '4px' }}>{t('badge_dead_stock')}</span>}
                    </td>
                    <td className="no-print" style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn-sm btn-outline" onClick={() => setMovItem(i)} title={t('btn_view_movements')}>📋</button>
                      <button className="btn btn-sm btn-outline" onClick={() => openAdj(i)} title={t('btn_manual_adj')}>⚖️</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock movements drawer */}
      {movItem && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        }}>
          <div className="card" style={{ width: '480px', height: '100%', borderRadius: 0, overflowY: 'auto' }}>
            <div className="flex-between mb-4">
              <h2 style={{ fontWeight: 900 }}>📋 {t('stock_movements_of')}: {movItem.name}</h2>
              <button className="btn btn-outline" onClick={() => setMovItem(null)}>✕</button>
            </div>
            <div style={{ marginBottom: '12px', display: 'flex', gap: '12px', fontSize: '13px' }}>
              <span>{t('label_current_stock')}: <strong>{fmtInt(movItem.stock)}</strong> {movItem.unit}</span>
            </div>
            {movLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>{t('loading')}</div>
            ) : movements.length === 0 ? (
              <div className="empty-state"><div className="icon">📋</div><p>{t('no_movements_recorded')}</p></div>
            ) : movements.map(m => (
              <div key={m.id} style={{
                padding: '10px 0', borderBottom: '1px solid var(--border-light)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px',
              }}>
                <div>
                  <span className="badge" style={{ background: MOVE_TYPE_COLOR[m.movement_type], color: '#fff', marginLeft: '8px' }}>
                    {MOVE_TYPE_KEY[m.movement_type] ? t(MOVE_TYPE_KEY[m.movement_type]) : m.movement_type}
                  </span>
                  {m.notes && <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>{m.notes}</div>}
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    {new Date(m.created_at).toLocaleDateString('ar-LB')}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: m.quantity >= 0 ? 'var(--success)' : 'var(--danger)', direction: 'ltr' }}>
                  {m.quantity >= 0 ? '+' : ''}{m.quantity}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual adjustment modal */}
      <Modal
        isOpen={adjModal}
        onClose={() => setAdjModal(false)}
        title={`⚖️ ${t('adj_modal_title')}`}
        footer={
          <>
            <button className="btn btn-primary" onClick={handleAdjust}>💾 {t('adj_apply_btn')}</button>
            <button className="btn btn-outline" onClick={() => setAdjModal(false)}>{t('cancel_btn')}</button>
          </>
        }
      >
        <p style={{ fontWeight: 600, marginBottom: '12px' }}>{adjForm.item_name}</p>
        <div className="form-group">
          <label className="form-label">{t('lbl_adj_qty')}</label>
          <input
            type="number"
            className="form-control"
            value={adjForm.qty}
            onChange={e => setAdjForm(f => ({ ...f, qty: e.target.value }))}
            placeholder="+10 / -5"
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t('lbl_adj_reason')}</label>
          <input
            className="form-control"
            value={adjForm.reason}
            onChange={e => setAdjForm(f => ({ ...f, reason: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  )
}
