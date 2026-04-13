import DocItemRow from './DocItemRow'

export default function DocItemsTable({ items, allItems, onAddRow, onRemoveRow, onUpdateRow, onSelectItem }) {
  return (
    <div className="card mt-4">
      <div className="card-header">
        <div className="card-title">📦 أصناف المستند</div>
        <button className="btn btn-sm btn-primary no-print" onClick={onAddRow}>➕ إضافة صنف</button>
      </div>
      <div className="table-wrapper">
        <table id="doc-items-table">
          <thead>
            <tr>
              <th style={{ width:'5%' }}>#</th>
              <th style={{ width:'15%' }}>Item Number</th>
              <th style={{ width:'30%' }}>Description</th>
              <th style={{ width:'10%' }}>Qty</th>
              <th style={{ width:'12%' }}>U.Price</th>
              <th style={{ width:'6%' }}>D%</th>
              <th style={{ width:'6%' }}>V%</th>
              <th style={{ width:'12%' }}>Total</th>
              <th style={{ width:'4%' }} className="no-print"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, idx) => (
              <DocItemRow
                key={row._rowId}
                row={row}
                rowNumber={idx + 1}
                allItems={allItems}
                onUpdate={(field, val) => onUpdateRow(row._rowId, field, val)}
                onSelect={item => onSelectItem(row._rowId, item)}
                onRemove={() => onRemoveRow(row._rowId)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
