import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useLang } from '../contexts/LangContext'
import { notify } from '../utils/notify'

export function useServices(companyId) {
  const { t } = useLang()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)

  const loadServices = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true })
    setServices(data || [])
    setLoading(false)
  }, [companyId])

  const saveService = useCallback(async (formData, editId) => {
    const data = { company_id: companyId, ...formData, active: true }
    if (editId) {
      const { error } = await supabase.from('services').update(data).eq('id', editId)
      if (error) { notify(t('save_error') + ': ' + error.message, 'error'); return false }
    } else {
      const { error } = await supabase.from('services').insert(data)
      if (error) { notify(t('save_error') + ': ' + error.message, 'error'); return false }
    }
    notify(t('notify_saved'))
    await loadServices()
    return true
  }, [companyId, loadServices, t])

  const deleteService = useCallback(async (id) => {
    if (!confirm(t('confirm_delete'))) return
    await supabase.from('services').delete().eq('id', id)
    notify(t('notify_deleted'))
    await loadServices()
  }, [loadServices, t])

  return { services, loading, loadServices, saveService, deleteService }
}
