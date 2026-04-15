import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { notify } from '../utils/notify'

export function useCustomers(companyId) {
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
      if (error) { notify('خطأ في الحفظ', 'error'); return }
    } else {
      const { error } = await supabase.from('customers').insert(data)
      if (error) { notify('خطأ في الحفظ', 'error'); return }
    }
    notify('تم حفظ العميل بنجاح')
    await loadCustomers()
  }, [companyId, loadCustomers])

  const deleteCustomer = useCallback(async (id) => {
    if (!confirm('هل تريد حذف هذا العميل؟')) return
    await supabase.from('customers').delete().eq('id', id)
    notify('تم حذف العميل')
    await loadCustomers()
  }, [loadCustomers])

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
      description: description || 'نقاط مكتسبة من عملية شراء',
    })
  }, [companyId])

  const redeemPoints = useCallback(async (customerId, points, invoiceId) => {
    const { data: customer } = await supabase
      .from('customers')
      .select('loyalty_points')
      .eq('id', customerId)
      .single()
    if (!customer || customer.loyalty_points < points) {
      notify('رصيد النقاط غير كافٍ', 'error')
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
      description: 'استرداد نقاط',
    })
    return true
  }, [companyId])

  return { customers, loading, loadCustomers, searchByPhone, saveCustomer, deleteCustomer, addLoyaltyPoints, redeemPoints }
}
