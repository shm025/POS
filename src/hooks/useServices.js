import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { notify } from '../utils/notify'

export function useServices(companyId) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)

  async function loadServices() {
    if (!companyId) return
    setLoading(true)
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true })
    setServices(data || [])
    setLoading(false)
  }

  async function saveService(formData, editId) {
    const data = { company_id: companyId, ...formData, active: true }
    if (editId) {
      await supabase.from('services').update(data).eq('id', editId)
    } else {
      await supabase.from('services').insert(data)
    }
    notify('تم حفظ الخدمة بنجاح')
    await loadServices()
  }

  async function deleteService(id) {
    if (!confirm('هل تريد حذف هذه الخدمة؟')) return
    await supabase.from('services').delete().eq('id', id)
    notify('تم حذف الخدمة')
    await loadServices()
  }

  return { services, loading, loadServices, saveService, deleteService }
}
