import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { notify } from '../utils/notify'

// Cloud schema: cost_price, selling_price, min_stock, description
const mapItem = row => ({
  ...row,
  cost: row.cost_price,
  price: row.selling_price,
  minStock: row.min_stock,
  desc: row.description,
})

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
      .order('created_at', { ascending: true })
    const mapped = (data || []).map(mapItem)
    setItems(mapped)
    setLoading(false)
    return mapped
  }, [companyId])

  const saveItem = useCallback(async (formData, editId) => {
    const data = {
      company_id: companyId,
      code: formData.code,
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      cost_price: formData.cost,
      selling_price: formData.price,
      stock: formData.stock,
      min_stock: formData.minStock,
      description: formData.desc,
    }
    if (editId) {
      await supabase.from('items').update(data).eq('id', editId)
    } else {
      await supabase.from('items').insert(data)
    }
    notify('تم حفظ الصنف بنجاح')
    await loadItems()
  }, [companyId, loadItems])

  const deleteItem = useCallback(async (id) => {
    await supabase.from('items').delete().eq('id', id)
    notify('تم حذف الصنف')
    await loadItems()
  }, [loadItems])

  const getItem = useCallback(async (id) => {
    const { data } = await supabase.from('items').select('*').eq('id', id).single()
    return data ? mapItem(data) : null
  }, [])

  return { items, loading, loadItems, saveItem, deleteItem, getItem }
}
