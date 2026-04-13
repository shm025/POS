import { useState, useCallback } from 'react'
import { dbGetAll, dbGet, dbPut, dbDelete } from '../lib/db'
import { notify } from '../utils/notify'

export function useItems() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const loadItems = useCallback(async () => {
    setLoading(true)
    const data = await dbGetAll('items')
    setItems(data)
    setLoading(false)
    return data
  }, [])

  const saveItem = useCallback(async (formData, editId) => {
    const data = { ...formData }
    if (editId) data.id = parseInt(editId)
    await dbPut('items', data)
    notify('تم حفظ الصنف بنجاح')
    const updated = await dbGetAll('items')
    setItems(updated)
  }, [])

  const deleteItem = useCallback(async (id) => {
    await dbDelete('items', id)
    notify('تم حذف الصنف')
    const updated = await dbGetAll('items')
    setItems(updated)
  }, [])

  const getItem = useCallback(async (id) => {
    return await dbGet('items', id)
  }, [])

  return { items, loading, loadItems, saveItem, deleteItem, getItem }
}
