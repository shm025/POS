import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useLang } from '../contexts/LangContext'
import { notify } from '../utils/notify'

export function useVouchers(companyId) {
  const { t } = useLang()
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(false)

  const loadVouchers = useCallback(async (type) => {
    if (!companyId) return []
    setLoading(true)
    const { data } = await supabase
      .from('vouchers')
      .select('*')
      .eq('company_id', companyId)
      .eq('type', type)
      .order('created_at', { ascending: false })
    setVouchers(data || [])
    setLoading(false)
    return data || []
  }, [companyId])

  const saveVoucher = useCallback(async (formData) => {
    const { error } = await supabase.from('vouchers').insert({
      company_id: companyId,
      type: formData.type,
      number: formData.number,
      date: formData.date,
      amount: formData.amount,
      party: formData.party,
      description: formData.desc,
      method: formData.method,
    })
    if (error) { notify(t('save_error') + ': ' + error.message, 'error'); return }
    notify(formData.type === 'receipt' ? t('notify_voucher_receipt') : t('notify_voucher_payment'))
    const { data } = await supabase
      .from('vouchers')
      .select('*')
      .eq('company_id', companyId)
      .eq('type', formData.type)
      .order('created_at', { ascending: false })
    setVouchers(data || [])
  }, [companyId, t])

  return { vouchers, loading, loadVouchers, saveVoucher }
}
