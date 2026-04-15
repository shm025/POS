import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useLang } from '../contexts/LangContext'
import { notify } from '../utils/notify'

export function useCommissions(companyId) {
  const { t } = useLang()
  const [commissions, setCommissions] = useState([])
  const [loading, setLoading] = useState(false)

  const loadCommissions = useCallback(async ({ periodStart, periodEnd, employeeId } = {}) => {
    if (!companyId) return []
    setLoading(true)
    let query = supabase
      .from('commissions')
      .select('*, employees(name, level, calendar_color)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (periodStart) query = query.gte('period_start', periodStart)
    if (periodEnd) query = query.lte('period_end', periodEnd)
    if (employeeId) query = query.eq('employee_id', employeeId)

    const { data } = await query
    setCommissions(data || [])
    setLoading(false)
    return data || []
  }, [companyId])

  const recordCommission = useCallback(async ({ employee, reservation, invoice }) => {
    if (!companyId || !employee || !reservation) return
    const serviceAmount = parseFloat(reservation.price || 0)
    const rate = parseFloat(employee.commission_rate || 0)
    const commissionAmount = serviceAmount * (rate / 100)

    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('commissions').insert({
      company_id: companyId,
      employee_id: employee.id,
      reservation_id: reservation.id,
      invoice_id: invoice?.id || null,
      service_amount: serviceAmount,
      commission_rate: rate,
      commission_amount: commissionAmount,
      period_start: today,
      period_end: today,
      paid_out: false,
    })
    if (error) { notify(t('notify_commission_error'), 'error'); return }
    notify(t('notify_commission_saved'))
  }, [companyId, t])

  const markPaid = useCallback(async (ids) => {
    await supabase.from('commissions')
      .update({ paid_out: true, paid_at: new Date().toISOString() })
      .in('id', ids)
    notify(t('notify_commission_paid'))
    await loadCommissions()
  }, [loadCommissions, t])

  const getSummary = useCallback((data) => {
    const map = {}
    ;(data || commissions).forEach(c => {
      const empId = c.employee_id
      if (!map[empId]) {
        map[empId] = {
          employee_id: empId,
          name: c.employees?.name || 'Unknown',
          level: c.employees?.level || '',
          color: c.employees?.calendar_color || '#3B82F6',
          services: 0,
          service_amount: 0,
          commission_amount: 0,
          tip_amount: 0,
          paid_out: 0,
          pending: 0,
        }
      }
      map[empId].services += 1
      map[empId].service_amount += parseFloat(c.service_amount || 0)
      map[empId].commission_amount += parseFloat(c.commission_amount || 0)
      map[empId].tip_amount += parseFloat(c.tip_amount || 0)
      if (c.paid_out) map[empId].paid_out += parseFloat(c.commission_amount || 0)
      else map[empId].pending += parseFloat(c.commission_amount || 0)
    })
    return Object.values(map).sort((a, b) => b.service_amount - a.service_amount)
  }, [commissions])

  return { commissions, loading, loadCommissions, recordCommission, markPaid, getSummary }
}
