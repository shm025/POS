import { useState, useCallback } from 'react'
import { dbGetAll, dbPut, dbDelete } from '../lib/db'
import { notify } from '../utils/notify'

export function useAccounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)

  const loadAccounts = useCallback(async () => {
    setLoading(true)
    const data = await dbGetAll('accounts')
    setAccounts(data)
    setLoading(false)
    return data
  }, [])

  const saveAccount = useCallback(async (formData, editId) => {
    const balance = parseFloat(formData.balance) || 0
    const data = {
      code: formData.code,
      name: formData.name,
      type: formData.type,
      debit: balance > 0 ? balance : 0,
      credit: balance < 0 ? Math.abs(balance) : 0,
    }
    if (editId) data.id = parseInt(editId)
    await dbPut('accounts', data)
    notify('تم حفظ الحساب')
    const updated = await dbGetAll('accounts')
    setAccounts(updated)
  }, [])

  const deleteAccount = useCallback(async (id) => {
    await dbDelete('accounts', id)
    notify('تم حذف الحساب')
    const updated = await dbGetAll('accounts')
    setAccounts(updated)
  }, [])

  return { accounts, loading, loadAccounts, saveAccount, deleteAccount }
}
