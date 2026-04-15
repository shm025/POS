import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useLang } from '../contexts/LangContext'
import { notify } from '../utils/notify'

export function useSupplies(companyId) {
  const { t } = useLang()
  const [supplies, setSupplies] = useState([])
  const [loading, setLoading] = useState(false)

  const loadSupplies = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    const { data } = await supabase
      .from('supplies')
      .select('*')
      .eq('company_id', companyId)
      .order('date', { ascending: false })
    setSupplies(data || [])
    setLoading(false)
  }, [companyId])

  const saveSupply = useCallback(async (formData) => {
    const { error } = await supabase.from('supplies').insert({ company_id: companyId, ...formData })
    if (error) { notify(t('save_error') + ': ' + error.message, 'error'); return false }
    notify(t('notify_saved'))
    await loadSupplies()
    return true
  }, [companyId, loadSupplies, t])

  const deleteSupply = useCallback(async (id) => {
    if (!confirm(t('confirm_delete'))) return
    await supabase.from('supplies').delete().eq('id', id)
    notify(t('notify_deleted'))
    await loadSupplies()
  }, [loadSupplies, t])

  return { supplies, loading, loadSupplies, saveSupply, deleteSupply }
}
