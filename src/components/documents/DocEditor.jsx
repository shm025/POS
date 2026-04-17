import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useDocuments } from '../../hooks/useDocuments'
import { useLang } from '../../contexts/LangContext'
import { supabase } from '../../lib/supabase'
import { DOC_TYPES } from '../../lib/constants'
import TypeaheadInput from '../common/TypeaheadInput'
import DocItemsTable from './DocItemsTable'
import DocSummaryCard from './DocSummaryCard'
import DocPrintHeader from './DocPrintHeader'

const DOC_TYPE_KEYS = {
  invoices:          { labelKey: 'doc_type_invoices',         partyKey: 'party_customer' },
  'sales-return':    { labelKey: 'doc_type_sales_return',     partyKey: 'party_customer' },
  orders:            { labelKey: 'doc_type_orders',           partyKey: 'party_customer' },
  purchases:         { labelKey: 'doc_type_purchases',        partyKey: 'party_supplier' },
  'purchases-return':{ labelKey: 'doc_type_purchases_return', partyKey: 'party_supplier' },
}

export default function DocEditor({ docType, docId }) {
  const { company } = useAuth()
  const { t } = useLang()
  const [warehouses, setWarehouses] = useState([])
  const {
    docMeta, docItems, allItems, partyCache, loading,
    subtotal, afterDisc, total, totalQty, discount, tax,
    loadDoc, loadPartyCache, addRow, removeRow, updateRow, selectItem, updateMeta, saveDoc, duplicateDoc,
  } = useDocuments(company?.id)

  const cfg = DOC_TYPES[docType] || DOC_TYPES.invoices
  const typeKeys = DOC_TYPE_KEYS[docType] || DOC_TYPE_KEYS.invoices

  useEffect(() => {
    loadDoc(docType, docId || null)
  }, [docType, docId, loadDoc])

  useEffect(() => {
    if (company?.id) loadPartyCache(company.id)
  }, [company, loadPartyCache])

  useEffect(() => {
    if (!company?.id) return
    supabase.from('warehouses').select('name').eq('company_id', company.id).order('created_at', { ascending: true })
      .then(({ data }) => setWarehouses((data || []).map(w => w.name)))
  }, [company?.id])

  if (loading) return <div style={{ padding:'40px', textAlign:'center' }}>{t('loading')}</div>

  const partyItems = partyCache.map(a => ({ ...a, name: a.name, code: a.code }))

  return (
    <div className="page-view">
      <DocPrintHeader
        docType={docType}
        docMeta={docMeta} subtotal={subtotal} afterDisc={afterDisc}
        total={total} totalQty={totalQty} discount={discount} tax={tax}
      />

      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>{cfg.icon} {t(typeKeys.labelKey)}</h1>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={duplicateDoc}>📋 {t('duplicate_btn') || 'تكرار'}</button>
          <button className="btn btn-outline" onClick={() => window.print()}>🖨 {t('print_btn')}</button>
          <button className="btn btn-success" onClick={saveDoc}>💾 {t('save_btn')}</button>
        </div>
      </div>

      <div className="grid-2">
        {/* Doc Info Card */}
        <div className="card">
          <div className="card-header"><div className="card-title">📋 {t('doc_info_title')}</div></div>

          <div className="form-group">
            <label className="form-label">{t('doc_number_label')}</label>
            <div className="invoice-number" id="doc-number">{docMeta.number}</div>
          </div>

          <div className="form-group">
            <label className="form-label">{t(typeKeys.partyKey)}</label>
            <TypeaheadInput
              value={docMeta.party}
              onChange={val => updateMeta('party', val)}
              onSelect={item => updateMeta('party', item.name)}
              items={partyItems}
              placeholder={t('doc_party_placeholder')}
              renderItem={it => (
                <><span>{it.name}</span><span className="item-code">{it.code || ''}</span></>
              )}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{t('lbl_date')}</label>
              <input type="date" className="form-control" id="doc-date"
                value={docMeta.date} onChange={e => updateMeta('date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('doc_due_date')}</label>
              <input type="date" className="form-control" id="doc-due"
                value={docMeta.dueDate} onChange={e => updateMeta('dueDate', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('doc_warehouse')}</label>
            <select className="form-control" id="doc-warehouse"
              value={docMeta.warehouse} onChange={e => updateMeta('warehouse', e.target.value)}>
              {warehouses.length > 0
                ? warehouses.map(w => <option key={w}>{w}</option>)
                : <option>{t('doc_warehouse')}</option>
              }
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('doc_status')}</label>
            <select className="form-control" id="doc-status"
              value={docMeta.status} onChange={e => updateMeta('status', e.target.value)}>
              <option value="unpaid">{t('status_unpaid')}</option>
              <option value="paid">{t('status_paid')}</option>
              <option value="partial">{t('status_partial')}</option>
              <option value="cancelled">{t('status_cancelled')}</option>
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
