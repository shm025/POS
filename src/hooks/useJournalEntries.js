import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useLang } from '../contexts/LangContext'
import { notify } from '../utils/notify'

const mapEntry = e => ({
  ...e,
  desc: e.description,
  debitAccId: e.debit_acc_id,
  creditAccId: e.credit_acc_id,
})

export function useJournalEntries(companyId) {
  const { t } = useLang()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)

  const loadEntries = useCallback(async () => {
    if (!companyId) return []
    setLoading(true)
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true })
    const mapped = (data || []).map(mapEntry)
    setEntries(mapped)
    setLoading(false)
    return mapped
  }, [companyId])

  const saveEntry = useCallback(async (formData) => {
    const { error } = await supabase.from('journal_entries').insert({
      company_id: companyId,
      date: formData.date,
      description: formData.desc,
      debit_acc_id: formData.debitAccId || null,
      credit_acc_id: formData.creditAccId || null,
      amount: formData.amount,
    })
    if (error) { notify(t('save_error') + ': ' + error.message, 'error'); return false }
    notify(t('notify_saved'))
    await loadEntries()
    return true
  }, [companyId, loadEntries, t])

  const deleteEntry = useCallback(async (id) => {
    if (!confirm(t('confirm_delete'))) return
    await supabase.from('journal_entries').delete().eq('id', id)
    notify(t('notify_deleted'))
    await loadEntries()
  }, [loadEntries, t])

  return { entries, loading, loadEntries, saveEntry, deleteEntry }
}
