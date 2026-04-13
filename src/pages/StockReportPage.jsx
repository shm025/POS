import { useState, useEffect } from 'react'
import { dbGetAll } from '../lib/db'
import { fmt, fmtInt } from '../utils/format'
import { exportStockCSV } from '../utils/csv'

export default function StockReportPage() {
  const [items, setItems] = useState([])

  useEffect(() => { dbGetAll('items').then(setItems) }, [])

  const totalValue = items.reduce((s, i) => s + (i.stock * i.cost), 0)
  const lowCount = items.filter(i => i.stock <= i.minStock).length

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>📈 كشف المخزون</h1>
        <button className="btn btn-outline" onClick={() => exportStockCSV(items)}>⬇ تصدير</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">إجمالي الأصناف</div><div className="stat-value">{fmtInt(items.length)}</div></div>
        <div className="stat-card"><div className="stat-label">إجمالي الوحدات</div><div className="stat-value">{fmtInt(items.reduce((s,i)=>s+i.stock,0))}</div></div>
        <div className="stat-card"><div className="stat-label">قيمة المخزون</div><div className="stat-value" style={{ fontSize:'18px', direction:'ltr' }}>${fmt(totalValue)}</div></div>
        <div className="stat-card"><div className="stat-label">أصناف منخفضة</div><div className="stat-value" style={{ color:'var(--danger)' }}>{fmtInt(lowCount)}</div></div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>كود</th><th>الصنف</th><th>المخزون الابتدائي</th><th>وارد</th><th>صادر</th><th>المخزون الحالي</th><th>القيمة</th><th>الحالة</th></tr>
            </thead>
            <tbody>
              {items.map(i => {
                const low = i.stock <= i.minStock
                return (
                  <tr key={i.id}>
                    <td><code>{i.code}</code></td>
                    <td style={{ fontWeight:600 }}>{i.name}</td>
                    <td>{fmtInt(i.stock)}</td>
                    <td style={{ color:'var(--success)' }}>0</td>
                    <td style={{ color:'var(--danger)' }}>0</td>
                    <td style={{ fontWeight:700, color:low?'var(--danger)':'var(--primary)' }}>{fmtInt(i.stock)} {i.unit}</td>
                    <td style={{ direction:'ltr' }}>${fmt(i.stock * i.cost)}</td>
                    <td><span className={`badge ${low?'badge-danger':'badge-success'}`}>{low?'منخفض':'متوفر'}</span></td>
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
