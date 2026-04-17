import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useLang } from '../contexts/LangContext'
import { notify } from '../utils/notify'

export function useCustomers(companyId) {
  const { t } = useLang()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)

  const loadCustomers = useCallback(async (search = '') => {
    if (!companyId) return []
    setLoading(true)
    let query = supabase
      .from('customers')
      .select('*')
      .eq('company_id', companyId)
      .order('name')
    if (search) query = query.ilike('name', `%${search}%`)
    const { data } = await query
    setCustomers(data || [])
    setLoading(false)
    return data || []
  }, [companyId])

  const searchByPhone = useCallback(async (phone) => {
    if (!companyId || !phone) return []
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', companyId)
      .ilike('phone', `%${phone}%`)
      .limit(5)
    return data || []
  }, [companyId])

  const saveCustomer = useCallback(async (formData, editId) => {
    const data = { company_id: companyId, ...formData }
    if (editId) {
      const { error } = await supabase.from('customers').update(data).eq('id', editId)
      if (error) { notify(t('save_error') + ': ' + error.message, 'error'); return false }
    } else {
      const { error } = await supabase.from('customers').insert(data)
      if (error) { notify(t('save_error') + ': ' + error.message, 'error'); return false }
    }
    notify(t('notify_saved'))
    await loadCustomers()
    return true
  }, [companyId, loadCustomers, t])

  const deleteCustomer = useCallback(async (id) => {
    if (!confirm(t('confirm_delete'))) return
    await supabase.from('customers').delete().eq('id', id)
    notify(t('notify_deleted'))
    await loadCustomers()
  }, [loadCustomers, t])

  const addLoyaltyPoints = useCallback(async (customerId, points, invoiceId, description) => {
    const { data: customer } = await supabase
      .from('customers')
      .select('loyalty_points')
      .eq('id', customerId)
      .single()
    if (!customer) return

    const newBalance = (customer.loyalty_points || 0) + points
    const tier = newBalance >= 5000 ? 'platinum'
      : newBalance >= 2000 ? 'gold'
      : newBalance >= 500 ? 'silver'
      : 'bronze'

    await supabase.from('customers').update({
      loyalty_points: newBalance,
      loyalty_tier: tier,
    }).eq('id', customerId)

    await supabase.from('loyalty_transactions').insert({
      company_id: companyId,
      customer_id: customerId,
      invoice_id: invoiceId || null,
      type: 'earn',
      points,
      balance_after: newBalance,
      description: description || t('notify_points_earned'),
    })
  }, [companyId])

  const redeemPoints = useCallback(async (customerId, points, invoiceId) => {
    const { data: customer } = await supabase
      .from('customers')
      .select('loyalty_points')
      .eq('id', customerId)
      .single()
    if (!customer || customer.loyalty_points < points) {
      notify(t('notify_points_insufficient'), 'error')
      return false
    }
    const newBalance = customer.loyalty_points - points
    const tier = newBalance >= 5000 ? 'platinum'
      : newBalance >= 2000 ? 'gold'
      : newBalance >= 500 ? 'silver'
      : 'bronze'

    await supabase.from('customers').update({
      loyalty_points: newBalance,
      loyalty_tier: tier,
    }).eq('id', customerId)

    await supabase.from('loyalty_transactions').insert({
      company_id: companyId,
      customer_id: customerId,
      invoice_id: invoiceId || null,
      type: 'redeem',
      points: -points,
      balance_after: newBalance,
      description: t('notify_points_redeemed'),
    })
    return true
  }, [companyId, t])

  return { customers, loading, loadCustomers, searchByPhone, saveCustomer, deleteCustomer, addLoyaltyPoints, redeemPoints }
}
