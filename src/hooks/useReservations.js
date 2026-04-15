import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { notify } from '../utils/notify'

export function useReservations(companyId) {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(false)

  const loadReservations = useCallback(async ({ statusFilter = '', dateFilter = '' } = {}) => {
    if (!companyId) return
    setLoading(true)
    let query = supabase
      .from('reservations')
      .select('*')
      .eq('company_id', companyId)
      .order('date', { ascending: false })
    if (statusFilter) query = query.eq('status', statusFilter)
    if (dateFilter) query = query.eq('date', dateFilter)
    const { data } = await query
    setReservations(data || [])
    setLoading(false)
  }, [companyId])

  const saveReservation = useCallback(async (formData, editId, filters = {}) => {
    const data = { company_id: companyId, ...formData }
    if (editId) {
      await supabase.from('reservations').update(data).eq('id', editId)
    } else {
      await supabase.from('reservations').insert(data)
    }
    notify('تم حفظ الحجز بنجاح')
    await loadReservations(filters)
  }, [companyId, loadReservations])

  const markDone = useCallback(async (id, filters = {}) => {
    await supabase.from('reservations').update({ status: 'done' }).eq('id', id)
    notify('تم تأكيد إنجاز الحجز ✅')
    await loadReservations(filters)
  }, [loadReservations])

  const deleteReservation = useCallback(async (id, filters = {}) => {
    if (!confirm('هل تريد حذف هذا الحجز؟')) return
    await supabase.from('reservations').delete().eq('id', id)
    notify('تم حذف الحجز')
    await loadReservations(filters)
  }, [loadReservations])

  return { reservations, loading, loadReservations, saveReservation, markDone, deleteReservation }
}
