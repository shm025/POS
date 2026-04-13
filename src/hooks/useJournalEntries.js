import { useState, useCallback } from 'react'
import { dbGetAll, dbPut, dbDelete } from '../lib/db'
import { notify } from '../utils/notify'

export function useJournalEntries() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)

  const loadEntries = useCallback(async () => {
    setLoading(true)
    const data = await dbGetAll('journalEntries')
    setEntries(data)
    setLoading(false)
    return data
  }, [])

  const saveEntry = useCallback(async (data) => {
    await dbPut('journalEntries', data)
    notify('تم حفظ القيد')
    const updated = await dbGetAll('journalEntries')
    setEntries(updated)
  }, [])

  const deleteEntry = useCallback(async (id) => {
    await dbDelete('journalEntries', id)
    notify('تم حذف القيد')
    const updated = await dbGetAll('journalEntries')
    setEntries(updated)
  }, [])

  return { entries, loading, loadEntries, saveEntry, deleteEntry }
}
