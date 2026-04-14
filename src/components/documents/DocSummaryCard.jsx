import { fmt } from '../../utils/format'
import { useLang } from '../../contexts/LangContext'

export default function DocSummaryCard({ subtotal, discount, tax, afterDisc, total, notes, onMetaChange }) {
  const { t } = useLang()
  return (
    <div className="card">
      <div className="card-header"><div className="card-title">💰 {t('doc_summary_title')}</div></div>
      <div style={{ display:'flex', flexDirection:'column', gap:'12px', padding:'4px 0' }}>
        <div className="flex-between" style={{ fontSize:'14px' }}>
          <span style={{ color:'var(--text-muted)' }}>{t('doc_subtotal')}</span>
          <span style={{ fontWeight:700, direction:'ltr' }} id="doc-subtotal">${fmt(subtotal)}</span>
        </div>
        <div className="flex-between" style={{ fontSize:'14px' }}>
          <span style={{ color:'var(--text-muted)' }}>{t('doc_discount_pct')}</span>
          <div className="flex gap-2" style={{ alignItems:'center' }}>
            <input type="number" className="form-control" style={{ width:'70px', textAlign:'center' }}
              value={discount} onChange={e => onMetaChange('discount', e.target.value)} id="doc-discount" />
          </div>
        </div>
        <div className="flex-between" style={{ fontSize:'14px' }}>
          <span style={{ color:'var(--text-muted)' }}>{t('doc_vat_pct')}</span>
          <div className="flex gap-2" style={{ alignItems:'center' }}>
            <input type="number" className="form-control" style={{ width:'70px', textAlign:'center' }}
              value={tax} onChange={e => onMetaChange('tax', e.target.value)} id="doc-tax" />
          </div>
        </div>
        <div style={{ borderTop:'2px solid var(--primary)', paddingTop:'12px' }} className="flex-between">
          <span style={{ fontSize:'16px', fontWeight:700, color:'var(--primary)' }}>{t('total_label')}</span>
          <span style={{ fontSize:'24px', fontWeight:900, color:'var(--primary)', direction:'ltr' }} id="doc-total">
            ${fmt(total)}
          </span>
        </div>
      </div>
      <div className="form-group mt-4">
        <label className="form-label">{t('doc_notes_label')}</label>
        <textarea className="form-control" rows="4" id="doc-notes"
          value={notes} onChange={e => onMetaChange('notes', e.target.value)} />
      </div>
    </div>
  )
}
