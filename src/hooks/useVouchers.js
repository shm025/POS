import { useState, useCallback } from 'react'
import { dbGetAll, dbPut } from '../lib/db'
import { notify } from '../utils/notify'

export function useVouchers() {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(false)

  const loadVouchers = useCallback(async (type) => {
    setLoading(true)
    const all = await dbGetAll('vouchers')
    const filtered = all.filter(v => v.type === type)
    setVouchers(filtered)
    setLoading(false)
    return filtered
  }, [])

  const saveVoucher = useCallback(async (data) => {
    await dbPut('vouchers', data)
    const typeLabel = data.type === 'receipt' ? 'القبض' : 'الصرف'
    notify(`تم حفظ سند ${typeLabel}`)
    const all = await dbGetAll('vouchers')
    setVouchers(all.filter(v => v.type === data.type))
  }, [])

  return { vouchers, loading, loadVouchers, saveVoucher }
}
