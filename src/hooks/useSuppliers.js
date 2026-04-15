import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useLang } from '../contexts/LangContext'
import { notify } from '../utils/notify'

export function useSuppliers(companyId) {
  const { t } = useLang()
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
      const { error } = await supabase.from('suppliers').update(data).eq('id', editId)
      if (error) { notify(t('save_error') + ': ' + error.message, 'error'); return false }
    } else {
      const { error } = await supabase.from('suppliers').insert(data)
      if (error) { notify(t('save_error') + ': ' + error.message, 'error'); return false }
    }
    notify(t('notify_saved'))
    await loadSuppliers()
    return true
  }, [companyId, loadSuppliers, t])

  const deleteSupplier = useCallback(async (id) => {
    if (!confirm(t('confirm_delete'))) return
    await supabase.from('suppliers').delete().eq('id', id)
    notify(t('notify_deleted'))
    await loadSuppliers()
  }, [loadSuppliers, t])

  return { suppliers, loading, loadSuppliers, saveSupplier, deleteSupplier }
}
