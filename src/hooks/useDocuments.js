import { useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { DOC_TYPES } from '../lib/constants'
import { useLang } from '../contexts/LangContext'
import { notify } from '../utils/notify'

// doc types that increase stock (purchases / sales-return)
const STOCK_IN = ['purchases', 'sales-return']

export function useDocuments(companyId) {
  const { t } = useLang()
  const [docType, setDocType] = useState('invoices')
  const [docId, setDocId] = useState(null)
  const [docMeta, setDocMeta] = useState({
    number: '', party: '', date: new Date().toISOString().split('T')[0],
    dueDate: '', warehouse: '', status: 'unpaid',
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

    const itemsPromise = companyId
      ? supabase.from('items').select('*').eq('company_id', companyId).eq('is_active', true).order('name', { ascending: true })
      : Promise.resolve({ data: [] })

    const docPromise = editId
      ? supabase.from('invoices').select('*, invoice_items(*)').eq('id', editId).single()
      : Promise.resolve({ data: null })

    const [{ data: itemsData }, { data: docData }] = await Promise.all([itemsPromise, docPromise])

    // Cloud: cost_price / selling_price
    const mappedItems = (itemsData || []).map(r => ({
      ...r,
      cost: r.cost_price,
      price: r.selling_price,
      minStock: r.min_stock,
      desc: r.description,
    }))
    setAllItems(mappedItems)

    let number
    if (editId && docData) {
      number = docData.number
    } else {
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('doc_type', type)
      number = `${cfg.prefix}-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`
    }

    const today = new Date().toISOString().split('T')[0]
    setDocMeta({
      number,
      party: docData?.customer_name || '',   // cloud uses customer_name
      date: docData?.date || today,
      dueDate: docData?.due_date || '',
      warehouse: docData?.warehouse || '',
      status: docData?.status || 'unpaid',
      discount: docData?.discount ?? 0,
      tax: docData?.tax ?? 11,
      notes: docData?.notes || '',
    })

    if (docData?.invoice_items?.length) {
      setDocItems(docData.invoice_items.map(it => ({
        _rowId: 'r' + (++rowCounter.current),
        itemId: it.item_id,
        itemCode: '',
        itemName: it.item_name || '',
        qty: it.quantity,
        price: it.unit_price,
        cost: it.cost_price || 0,
        discount: it.discount,
        total: it.total,
      })))
    } else {
      setDocItems([{ _rowId: 'r' + (++rowCounter.current), itemId: null, itemName: '', qty: 1, price: 0, discount: 0, total: 0 }])
    }

    setLoading(false)
  }, [companyId])

  const loadPartyCache = useCallback(async (cid) => {
    if (!cid) return
    const [{ data: custs }, { data: supps }] = await Promise.all([
      supabase.from('customers').select('id,name').eq('company_id', cid),
      supabase.from('suppliers').select('id,name').eq('company_id', cid),
    ])
    setPartyCache([
      ...(custs || []).map(c => ({ ...c, code: '' })),
      ...(supps || []).map(s => ({ ...s, code: '' })),
    ])
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
      return { ...r, itemId: item.id, itemCode: item.code || '', itemName: item.name || '', price, cost: item.cost || 0, qty, total: qty * price }
    }))
  }

  function updateMeta(field, value) {
    setDocMeta(prev => ({ ...prev, [field]: value }))
  }

  const subtotal = docItems.reduce((s, r) => s + (r.total || 0), 0)
  const discount = parseFloat(docMeta.discount) || 0
  const tax = parseFloat(docMeta.tax) || 0
  const afterDisc = subtotal * (1 - discount / 100)
  const total = afterDisc * (1 + tax / 100)
  const totalQty = docItems.reduce((s, r) => s + (parseFloat(r.qty) || 0), 0)

  async function applyStockChanges(items, type, direction) {
    const increase = STOCK_IN.includes(type) ? direction > 0 : direction < 0
    for (const it of items) {
      if (!it.item_id || !it.qty) continue
      const { data: cur } = await supabase.from('items').select('stock').eq('id', it.item_id).single()
      if (!cur) continue
      const delta = increase ? Math.abs(it.qty) : -Math.abs(it.qty)
      await supabase.from('items').update({ stock: (cur.stock || 0) + delta }).eq('id', it.item_id)
    }
  }

  async function saveDoc() {
    if (!docMeta.party) {
      notify(t('doc_party_required') + ' ' + (DOC_TYPES[docType]?.partyLabel_ar || ''), 'error')
      return
    }

    const invoiceData = {
      company_id: companyId,
      doc_type: docType,
      number: docMeta.number,
      customer_name: docMeta.party,   // map party → customer_name
      date: docMeta.date,
      due_date: docMeta.dueDate || null,
      warehouse: docMeta.warehouse,
      status: docMeta.status,
      subtotal,
      discount,
      tax,
      total: +total.toFixed(2),
      notes: docMeta.notes,
    }

    let invoiceUuid = docId

    if (docId) {
      // Revert old stock
      const { data: oldItems } = await supabase.from('invoice_items').select('item_id, quantity').eq('invoice_id', docId)
      if (oldItems?.length) {
        await applyStockChanges(oldItems.map(i => ({ item_id: i.item_id, qty: i.quantity })), docType, -1)
      }
      await supabase.from('invoices').update(invoiceData).eq('id', docId)
      await supabase.from('invoice_items').delete().eq('invoice_id', docId)
      await supabase.from('stock_movements').delete().eq('invoice_id', docId)
    } else {
      const { data: newInv } = await supabase.from('invoices').insert(invoiceData).select().single()
      invoiceUuid = newInv.id
    }

    const newLineItems = docItems
      .filter(r => r.itemName || r.itemId)
      .map(r => ({
        invoice_id: invoiceUuid,
        company_id: companyId,
        item_id: r.itemId || null,
        item_name: r.itemName,
        quantity: parseFloat(r.qty) || 0,
        unit_price: parseFloat(r.price) || 0,
        cost_price: parseFloat(r.cost) || 0,
        discount: parseFloat(r.discount) || 0,
        total: parseFloat(r.total) || 0,
      }))

    if (newLineItems.length) {
      await supabase.from('invoice_items').insert(newLineItems)
      await applyStockChanges(newLineItems.map(i => ({ item_id: i.item_id, qty: i.quantity })), docType, 1)

      const movements = newLineItems
        .filter(i => i.item_id)
        .map(i => ({
          company_id: companyId,
          item_id: i.item_id,
          invoice_id: invoiceUuid,
          movement_type: docType,
          quantity: i.quantity,
          cost_at_time: i.cost_price || 0,
        }))
      if (movements.length) await supabase.from('stock_movements').insert(movements)
    }

    notify(t('notify_doc_saved'))
    setTimeout(() => loadDoc(docType, invoiceUuid), 300)
  }

  async function duplicateDoc() {
    const cfg = DOC_TYPES[docType]
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('doc_type', docType)
    const newNumber = `${cfg.prefix}-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`
    setDocId(null)
    setDocMeta(prev => ({
      ...prev,
      number: newNumber,
      date: new Date().toISOString().split('T')[0],
      status: 'unpaid',
    }))
    notify('📋 ' + t('doc_duplicated'))
  }

  return {
    docType, docId, docMeta, docItems, allItems, partyCache,
    loading, subtotal, afterDisc, total, totalQty, discount, tax,
    loadDoc, loadPartyCache, addRow, removeRow, updateRow, selectItem, updateMeta, saveDoc, duplicateDoc,
  }
}
