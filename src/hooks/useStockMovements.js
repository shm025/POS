import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { notify } from '../utils/notify'

export function useStockMovements(companyId) {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(false)

  const loadMovements = useCallback(async ({ itemId, type, limit = 100 } = {}) => {
    if (!companyId) return []
    setLoading(true)
    let query = supabase
      .from('stock_movements')
      .select('*, items(name, code, unit)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (itemId) query = query.eq('item_id', itemId)
    if (type) query = query.eq('movement_type', type)

    const { data } = await query
    setMovements(data || [])
    setLoading(false)
    return data || []
  }, [companyId])

  // Manual stock adjustment with audit
  const adjustStock = useCallback(async ({ itemId, qty, reason, userId }) => {
    if (!companyId) return

    const { data: item } = await supabase
      .from('items')
      .select('stock, name')
      .eq('id', itemId)
      .single()

    if (!item) { notify('الصنف غير موجود', 'error'); return }

    const newStock = (item.stock || 0) + qty
    await supabase.from('items').update({ stock: newStock }).eq('id', itemId)

    await supabase.from('stock_movements').insert({
      company_id: companyId,
      item_id: itemId,
      movement_type: 'adjust',
      quantity: qty,
      user_id: userId || null,
      notes: reason || 'تعديل يدوي',
    })

    await supabase.from('audit_log').insert({
      company_id: companyId,
      user_id: userId || null,
      action: 'STOCK_ADJUST',
      table_name: 'items',
      record_id: itemId,
      old_values: { stock: item.stock },
      new_values: { stock: newStock },
    })

    notify(`تم تعديل مخزون "${item.name}" إلى ${newStock}`)
    await loadMovements()
  }, [companyId, loadMovements])

  return { movements, loading, loadMovements, adjustStock }
}
