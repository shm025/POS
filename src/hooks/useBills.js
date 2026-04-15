import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useLang } from '../contexts/LangContext'
import { notify } from '../utils/notify'

export function useBills(companyId) {
  const { t } = useLang()
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(false)

  const loadBills = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    const { data } = await supabase
      .from('bills')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    setBills(data || [])
    setLoading(false)
  }, [companyId])

  const saveBill = useCallback(async (formData) => {
    const { error } = await supabase.from('bills').insert({ company_id: companyId, ...formData, paid: false })
    if (error) { notify(t('save_error') + ': ' + error.message, 'error'); return false }
    notify(t('notify_saved'))
    await loadBills()
    return true
  }, [companyId, loadBills, t])

  const togglePaid = useCallback(async (id, currentPaid) => {
    await supabase.from('bills').update({ paid: !currentPaid }).eq('id', id)
    notify(!currentPaid ? t('notify_bill_paid') : t('notify_bill_unpaid'))
    await loadBills()
  }, [loadBills, t])

  const deleteBill = useCallback(async (id) => {
    if (!confirm(t('confirm_delete'))) return
    await supabase.from('bills').delete().eq('id', id)
    notify(t('notify_deleted'))
    await loadBills()
  }, [loadBills, t])

  return { bills, loading, loadBills, saveBill, togglePaid, deleteBill }
}
