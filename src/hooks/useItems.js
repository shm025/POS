import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { notify } from '../utils/notify'

export function useItems(companyId) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const loadItems = useCallback(async () => {
    if (!companyId) return []
    setLoading(true)
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name')
    setItems(data || [])
    setLoading(false)
    return data || []
  }, [companyId])

  // Full-text + barcode search for POS checkout
  const searchItems = useCallback(async (q) => {
    if (!companyId || !q) return []
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .or(`name.ilike.%${q}%,code.ilike.%${q}%,barcode.ilike.%${q}%,brand.ilike.%${q}%`)
      .limit(20)
    return data || []
  }, [companyId])

  const saveItem = useCallback(async (formData, editId) => {
    const data = {
      company_id: companyId,
      code: formData.code,
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      cost_price: parseFloat(formData.cost_price || formData.cost) || 0,
      selling_price: parseFloat(formData.selling_price || formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      reorder_point: parseInt(formData.reorder_point || formData.minStock) || 5,
      reorder_qty: parseInt(formData.reorder_qty) || 10,
      barcode: formData.barcode || null,
      brand: formData.brand || null,
      tax_rate: parseFloat(formData.tax_rate) || 0,
      sell_by_weight: formData.sell_by_weight || false,
      is_active: true,
    }
    if (editId) {
      const { error } = await supabase.from('items').update(data).eq('id', editId)
      if (error) { notify('خطأ في الحفظ', 'error'); return }
    } else {
      const { error } = await supabase.from('items').insert(data)
      if (error) { notify('خطأ في الحفظ', 'error'); return }
    }
    notify('تم حفظ الصنف بنجاح')
    await loadItems()
  }, [companyId, loadItems])

  const deleteItem = useCallback(async (id) => {
    if (!confirm('هل تريد حذف هذا الصنف؟')) return
    // Soft delete
    await supabase.from('items').update({ is_active: false }).eq('id', id)
    notify('تم حذف الصنف')
    await loadItems()
  }, [loadItems])

  const getItem = useCallback(async (id) => {
    const { data } = await supabase.from('items').select('*').eq('id', id).single()
    return data || null
  }, [])

  return { items, loading, loadItems, searchItems, saveItem, deleteItem, getItem }
}
