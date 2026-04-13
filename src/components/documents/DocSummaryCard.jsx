import { fmt } from '../../utils/format'

export default function DocSummaryCard({ subtotal, discount, tax, afterDisc, total, notes, onMetaChange }) {
  return (
    <div className="card">
      <div className="card-header"><div className="card-title">💰 ملخص المستند</div></div>
      <div style={{ display:'flex', flexDirection:'column', gap:'12px', padding:'4px 0' }}>
        <div className="flex-between" style={{ fontSize:'14px' }}>
          <span style={{ color:'var(--text-muted)' }}>المجموع الفرعي</span>
          <span style={{ fontWeight:700, direction:'ltr' }} id="doc-subtotal">${fmt(subtotal)}</span>
        </div>
        <div className="flex-between" style={{ fontSize:'14px' }}>
          <span style={{ color:'var(--text-muted)' }}>الخصم %</span>
          <div className="flex gap-2" style={{ alignItems:'center' }}>
            <input type="number" className="form-control" style={{ width:'70px', textAlign:'center' }}
              value={discount} onChange={e => onMetaChange('discount', e.target.value)} id="doc-discount" />
          </div>
        </div>
        <div className="flex-between" style={{ fontSize:'14px' }}>
          <span style={{ color:'var(--text-muted)' }}>ضريبة VAT %</span>
          <div className="flex gap-2" style={{ alignItems:'center' }}>
            <input type="number" className="form-control" style={{ width:'70px', textAlign:'center' }}
              value={tax} onChange={e => onMetaChange('tax', e.target.value)} id="doc-tax" />
          </div>
        </div>
        <div style={{ borderTop:'2px solid var(--primary)', paddingTop:'12px' }} className="flex-between">
          <span style={{ fontSize:'16px', fontWeight:700, color:'var(--primary)' }}>الإجمالي</span>
          <span style={{ fontSize:'24px', fontWeight:900, color:'var(--primary)', direction:'ltr' }} id="doc-total">
            ${fmt(total)}
          </span>
        </div>
      </div>
      <div className="form-group mt-4">
        <label className="form-label">ملاحظات</label>
        <textarea className="form-control" rows="4" id="doc-notes"
          value={notes} onChange={e => onMetaChange('notes', e.target.value)} />
      </div>
    </div>
  )
}
