import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { notify } from '../utils/notify'

export function useSupplies(companyId) {
  const [supplies, setSupplies] = useState([])
  const [loading, setLoading] = useState(false)

  async function loadSupplies() {
    if (!companyId) return
    setLoading(true)
    const { data } = await supabase
      .from('supplies')
      .select('*')
      .eq('company_id', companyId)
      .order('date', { ascending: false })
    setSupplies(data || [])
    setLoading(false)
  }

  async function saveSupply(formData) {
    await supabase.from('supplies').insert({ company_id: companyId, ...formData })
    notify('تم حفظ المستلزم')
    await loadSupplies()
  }

  async function deleteSupply(id) {
    if (!confirm('حذف هذا السجل؟')) return
    await supabase.from('supplies').delete().eq('id', id)
    notify('تم الحذف')
    await loadSupplies()
  }

  return { supplies, loading, loadSupplies, saveSupply, deleteSupply }
}
