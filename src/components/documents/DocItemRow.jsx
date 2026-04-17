import TypeaheadInput from '../common/TypeaheadInput'
import { fmt } from '../../utils/format'
import { useLang } from '../../contexts/LangContext'

export default function DocItemRow({ row, rowNumber, allItems, onUpdate, onSelect, onRemove }) {
  const { t } = useLang()
  return (
    <tr id={`tr-${row._rowId}`}>
      <td style={{ width:'5%', textAlign:'center', color:'var(--text-muted)', fontSize:'12px' }}>{rowNumber}</td>
      <td style={{ width:'15%' }}>
        <TypeaheadInput
          value={row.itemCode || ''}
          onChange={val => onUpdate('itemCode', val)}
          onSelect={item => onSelect(item)}
          items={allItems}
          placeholder={t('ph_item_code')}
        />
        <span className="print-value">{row.itemCode || ''}</span>
      </td>
      <td style={{ width:'30%' }}>
        <TypeaheadInput
          value={row.itemName || ''}
          onChange={val => onUpdate('itemName', val)}
          onSelect={item => onSelect(item)}
          items={allItems}
          placeholder={t('ph_item_name')}
          renderItem={it => (
            <>
              <span>{it.name}</span>
              <span className="item-code">{it.code || ''}</span>
              <span className="item-price">${fmt(it.price)}</span>
            </>
          )}
        />
        <span className="print-value">{row.itemName || ''}</span>
      </td>
      <td style={{ width:'10%' }}>
        <input type="number" className="form-control" value={row.qty} min="1"
          onChange={e => onUpdate('qty', e.target.value)} />
        <span className="print-value">{row.qty}</span>
      </td>
      <td style={{ width:'12%' }}>
        <input type="number" className="form-control" value={row.price} step="0.01"
          onChange={e => onUpdate('price', e.target.value)} />
        <span className="print-value">{fmt(row.price)}</span>
      </td>
      <td style={{ width:'6%', textAlign:'center' }}>
        <input type="number" className="form-control" value={row.discount} min="0" max="100"
          onChange={e => onUpdate('discount', e.target.value)} style={{ width:'50px' }} />
        <span className="print-value">{row.discount || 0}</span>
      </td>
      <td style={{ width:'6%', textAlign:'center', color:'var(--text-muted)', fontSize:'11px' }}>0</td>
      <td style={{ width:'12%', fontWeight:700, color:'var(--primary)', direction:'ltr', textAlign:'right' }}>
        {fmt(row.total)}
      </td>
      <td style={{ width:'4%' }} className="no-print">
        <button className="btn btn-sm btn-danger" onClick={onRemove}>✕</button>
      </td>
    </tr>
  )
}
