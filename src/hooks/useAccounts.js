import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { notify } from '../utils/notify'

export function useAccounts(companyId) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)

  const loadAccounts = useCallback(async () => {
    if (!companyId) return []
    setLoading(true)
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('company_id', companyId)
      .order('code', { ascending: true })
    setAccounts(data || [])
    setLoading(false)
    return data || []
  }, [companyId])

  const saveAccount = useCallback(async (formData, editId) => {
    const balance = parseFloat(formData.balance) || 0
    const data = {
      company_id: companyId,
      code: formData.code,
      name: formData.name,
      type: formData.type,
      debit: balance > 0 ? balance : 0,
      credit: balance < 0 ? Math.abs(balance) : 0,
    }
    if (editId) {
      await supabase.from('accounts').update(data).eq('id', editId)
    } else {
      await supabase.from('accounts').insert(data)
    }
    notify('تم حفظ الحساب')
    await loadAccounts()
  }, [companyId, loadAccounts])

  const deleteAccount = useCallback(async (id) => {
    await supabase.from('accounts').delete().eq('id', id)
    notify('تم حذف الحساب')
    await loadAccounts()
  }, [loadAccounts])

  return { accounts, loading, loadAccounts, saveAccount, deleteAccount }
}
