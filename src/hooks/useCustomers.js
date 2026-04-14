import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { notify } from '../utils/notify'

export function useCustomers(companyId) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)

  const loadCustomers = useCallback(async () => {
    if (!companyId) return []
    setLoading(true)
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true })
    setCustomers(data || [])
    setLoading(false)
    return data || []
  }, [companyId])

  const saveCustomer = useCallback(async (formData, editId) => {
    const data = { company_id: companyId, ...formData }
    if (editId) {
      await supabase.from('customers').update(data).eq('id', editId)
    } else {
      await supabase.from('customers').insert(data)
    }
    notify('تم حفظ العميل')
    await loadCustomers()
  }, [companyId, loadCustomers])

  const deleteCustomer = useCallback(async (id) => {
    await supabase.from('customers').delete().eq('id', id)
    notify('تم حذف العميل')
    await loadCustomers()
  }, [loadCustomers])

  return { customers, loading, loadCustomers, saveCustomer, deleteCustomer }
}
