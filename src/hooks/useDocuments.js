import { useState, useCallback, useRef } from 'react'
import { dbGet, dbGetAll, dbPut } from '../lib/db'
import { supabase } from '../lib/supabase'
import { DOC_TYPES } from '../lib/constants'
import { notify } from '../utils/notify'

export function useDocuments() {
  const [docType, setDocType] = useState('invoices')
  const [docId, setDocId] = useState(null)
  const [docMeta, setDocMeta] = useState({
    number: '', party: '', date: new Date().toISOString().split('T')[0],
    dueDate: '', warehouse: 'المخزن الرئيسي', status: 'unpaid',
    discount: 0, tax: 11, notes: '',
  })
  const [docItems, setDocItems] = useState([])
  const [allItems, setAllItems] = useState([])
  const [partyCache, setPartyCache] = useState([])
  const [loading, setLoading] = useState(false)
  const rowCounter = useRef(0)

  const loadDoc = useCallback(async (type, editId = null) => {
    setLoading(true)
    const cfg = DOC_TYPES[type]
    setDocType(type)
    setDocId(editId)

    const [items, all] = await Promise.all([
      dbGetAll('items'),
      editId ? dbGet(cfg.store, editId) : Promise.resolve(null),
    ])
    setAllItems(items)

    let number
    if (editId && all) {
      number = all.number
    } else {
      const existing = await dbGetAll(cfg.store)
      number = `${cfg.prefix}-2026-${String(existing.length + 1).padStart(3, '0')}`
    }

    const today = new Date().toISOString().split('T')[0]
    setDocMeta({
      number,
      party: all?.party || '',
      date: all?.date || today,
      dueDate: all?.dueDate || '',
      warehouse: all?.warehouse || 'المخزن الرئيسي',
      status: all?.status || 'unpaid',
      discount: all?.discount ?? 0,
      tax: all?.tax ?? 11,
      notes: all?.notes || '',
    })

    if (all?.items?.length) {
      setDocItems(all.items.map(it => ({ ...it, _rowId: it._rowId || 'r' + (++rowCounter.current) })))
    } else {
      const newRow = { _rowId: 'r' + (++rowCounter.current), itemId: null, itemName: '', qty: 1, price: 0, discount: 0, total: 0 }
      setDocItems([newRow])
    }

    // Load party cache from Supabase
    setLoading(false)
  }, [])

  const loadPartyCache = useCallback(async (companyId) => {
    if (!companyId) return
    const { data } = await supabase.from('accounts').select('id,name,code').eq('company_id', companyId)
    setPartyCache(data || [])
  }, [])

  function addRow() {
    const newRow = { _rowId: 'r' + (++rowCounter.current), itemId: null, itemName: '', qty: 1, price: 0, discount: 0, total: 0 }
    setDocItems(prev => [...prev, newRow])
    return newRow._rowId
  }

  function removeRow(rowId) {
    setDocItems(prev => prev.filter(r => r._rowId !== rowId))
  }

  function updateRow(rowId, field, value) {
    setDocItems(prev => prev.map(r => {
      if (r._rowId !== rowId) return r
      const updated = { ...r, [field]: value }
      updated.total = (parseFloat(updated.qty) || 0) * (parseFloat(updated.price) || 0) * (1 - (parseFloat(updated.discount) || 0) / 100)
      return updated
    }))
  }

  function selectItem(rowId, item) {
    setDocItems(prev => prev.map(r => {
      if (r._rowId !== rowId) return r
      const qty = parseFloat(r.qty) || 1
      const price = item.price || 0
      return { ...r, itemId: item.id, itemCode: item.code || '', itemName: item.name || '', price, qty, total: qty * price }
    }))
  }

  function updateMeta(field, value) {
    setDocMeta(prev => ({ ...prev, [field]: value }))
  }

  // Computed totals
  const subtotal = docItems.reduce((s, r) => s + (r.total || 0), 0)
  const discount = parseFloat(docMeta.discount) || 0
  const tax = parseFloat(docMeta.tax) || 0
  const afterDisc = subtotal * (1 - discount / 100)
  const total = afterDisc * (1 + tax / 100)
  const totalQty = docItems.reduce((s, r) => s + (parseFloat(r.qty) || 0), 0)

  async function saveDoc() {
    if (!docMeta.party) {
      const cfg = DOC_TYPES[docType]
      notify('الرجاء اختيار ' + cfg.partyLabel_ar, 'error')
      return
    }
    const data = {
      number: docMeta.number,
      party: docMeta.party,
      date: docMeta.date,
      dueDate: docMeta.dueDate,
      warehouse: docMeta.warehouse,
      status: docMeta.status,
      subtotal,
      discount,
      tax,
      total: +total.toFixed(2),
      notes: docMeta.notes,
      items: docItems.map(r => ({ ...r })),
      docType,
    }
    if (docId !== null) data.id = docId
    const savedId = await dbPut(DOC_TYPES[docType].store, data)
    notify('تم حفظ المستند بنجاح ✓')
    // Reload for edit mode
    const realId = docId || savedId
    setTimeout(() => loadDoc(docType, realId), 300)
  }

  return {
    docType, docId, docMeta, docItems, allItems, partyCache,
    loading, subtotal, afterDisc, total, totalQty, discount, tax,
    loadDoc, loadPartyCache, addRow, removeRow, updateRow, selectItem, updateMeta, saveDoc,
  }
}
