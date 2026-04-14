import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { notify } from '../utils/notify'

// Maps DB snake_case to the shape the pages expect
const mapEntry = e => ({
  ...e,
  desc: e.description,
  debitAccId: e.debit_acc_id,
  creditAccId: e.credit_acc_id,
})

export function useJournalEntries(companyId) {
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
    await supabase.from('journal_entries').insert({
      company_id: companyId,
      date: formData.date,
      description: formData.desc,
      debit_acc_id: formData.debitAccId || null,
      credit_acc_id: formData.creditAccId || null,
      amount: formData.amount,
    })
    notify('تم حفظ القيد')
    await loadEntries()
  }, [companyId, loadEntries])

  const deleteEntry = useCallback(async (id) => {
    await supabase.from('journal_entries').delete().eq('id', id)
    notify('تم حذف القيد')
    await loadEntries()
  }, [loadEntries])

  return { entries, loading, loadEntries, saveEntry, deleteEntry }
}
