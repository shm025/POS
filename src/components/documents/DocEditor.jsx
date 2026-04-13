import { useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useDocuments } from '../../hooks/useDocuments'
import { DOC_TYPES } from '../../lib/constants'
import TypeaheadInput from '../common/TypeaheadInput'
import DocItemsTable from './DocItemsTable'
import DocSummaryCard from './DocSummaryCard'
import DocPrintHeader from './DocPrintHeader'

export default function DocEditor({ docType, docId }) {
  const { company } = useAuth()
  const {
    docMeta, docItems, allItems, partyCache, loading,
    subtotal, afterDisc, total, totalQty, discount, tax,
    loadDoc, loadPartyCache, addRow, removeRow, updateRow, selectItem, updateMeta, saveDoc,
  } = useDocuments()

  const cfg = DOC_TYPES[docType] || DOC_TYPES.invoices

  useEffect(() => {
    loadDoc(docType, docId || null)
  }, [docType, docId, loadDoc])

  useEffect(() => {
    if (company?.id) loadPartyCache(company.id)
  }, [company, loadPartyCache])

  if (loading) return <div style={{ padding:'40px', textAlign:'center' }}>جاري التحميل...</div>

  const partyItems = partyCache.map(a => ({ ...a, name: a.name, code: a.code }))

  return (
    <div className="page-view">
      <DocPrintHeader
        docMeta={docMeta} subtotal={subtotal} afterDisc={afterDisc}
        total={total} totalQty={totalQty} discount={discount} tax={tax}
      />

      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>{cfg.icon} {cfg.label_ar}</h1>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => window.print()}>🖨 طباعة</button>
          <button className="btn btn-success" onClick={saveDoc}>💾 حفظ</button>
        </div>
      </div>

      <div className="grid-2">
        {/* Doc Info Card */}
        <div className="card">
          <div className="card-header"><div className="card-title">📋 معلومات المستند</div></div>

          <div className="form-group">
            <label className="form-label">رقم المستند</label>
            <div className="invoice-number" id="doc-number">{docMeta.number}</div>
          </div>

          <div className="form-group">
            <label className="form-label">{cfg.partyLabel_ar}</label>
            <TypeaheadInput
              value={docMeta.party}
              onChange={val => updateMeta('party', val)}
              onSelect={item => updateMeta('party', item.name)}
              items={partyItems}
              placeholder="اكتب اسم العميل أو كوده..."
              renderItem={it => (
                <><span>{it.name}</span><span className="item-code">{it.code || ''}</span></>
              )}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">التاريخ</label>
              <input type="date" className="form-control" id="doc-date"
                value={docMeta.date} onChange={e => updateMeta('date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">تاريخ الاستحقاق</label>
              <input type="date" className="form-control" id="doc-due"
                value={docMeta.dueDate} onChange={e => updateMeta('dueDate', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">المخزن</label>
            <select className="form-control" id="doc-warehouse"
              value={docMeta.warehouse} onChange={e => updateMeta('warehouse', e.target.value)}>
              <option>المخزن الرئيسي</option>
              <option>مخزن فرعي</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">الحالة</label>
            <select className="form-control" id="doc-status"
              value={docMeta.status} onChange={e => updateMeta('status', e.target.value)}>
              <option value="unpaid">غير مدفوعة</option>
              <option value="paid">مدفوعة</option>
              <option value="partial">جزئي</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
        </div>

        {/* Summary Card */}
        <DocSummaryCard
          subtotal={subtotal} discount={discount} tax={tax}
          afterDisc={afterDisc} total={total} notes={docMeta.notes}
          onMetaChange={updateMeta}
        />
      </div>

      <DocItemsTable
        items={docItems}
        allItems={allItems}
        onAddRow={addRow}
        onRemoveRow={removeRow}
        onUpdateRow={updateRow}
        onSelectItem={selectItem}
      />
    </div>
  )
}
