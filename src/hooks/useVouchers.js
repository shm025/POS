import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { notify } from '../utils/notify'

export function useVouchers(companyId) {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(false)

  const loadVouchers = useCallback(async (type) => {
    if (!companyId) return []
    setLoading(true)
    const { data } = await supabase
      .from('vouchers')
      .select('*')
      .eq('company_id', companyId)
      .eq('type', type)             // cloud uses 'type' not 'voucher_type'
      .order('created_at', { ascending: false })
    setVouchers(data || [])
    setLoading(false)
    return data || []
  }, [companyId])

  const saveVoucher = useCallback(async (formData) => {
    await supabase.from('vouchers').insert({
      company_id: companyId,
      type: formData.type,          // cloud column is 'type'
      number: formData.number,
      date: formData.date,
      amount: formData.amount,
      party: formData.party,
      description: formData.desc,
      method: formData.method,
    })
    const typeLabel = formData.type === 'receipt' ? 'القبض' : 'الصرف'
    notify(`تم حفظ سند ${typeLabel}`)
    const { data } = await supabase
      .from('vouchers')
      .select('*')
      .eq('company_id', companyId)
      .eq('type', formData.type)
      .order('created_at', { ascending: false })
    setVouchers(data || [])
  }, [companyId])

  return { vouchers, loading, loadVouchers, saveVoucher }
}
