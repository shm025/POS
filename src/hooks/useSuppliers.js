import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { notify } from '../utils/notify'

export function useSuppliers(companyId) {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)

  const loadSuppliers = useCallback(async () => {
    if (!companyId) return []
    setLoading(true)
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true })
    setSuppliers(data || [])
    setLoading(false)
    return data || []
  }, [companyId])

  const saveSupplier = useCallback(async (formData, editId) => {
    const data = { company_id: companyId, ...formData }
    if (editId) {
      await supabase.from('suppliers').update(data).eq('id', editId)
    } else {
      await supabase.from('suppliers').insert(data)
    }
    notify('تم حفظ المورد')
    await loadSuppliers()
  }, [companyId, loadSuppliers])

  const deleteSupplier = useCallback(async (id) => {
    await supabase.from('suppliers').delete().eq('id', id)
    notify('تم حذف المورد')
    await loadSuppliers()
  }, [loadSuppliers])

  return { suppliers, loading, loadSuppliers, saveSupplier, deleteSupplier }
}
