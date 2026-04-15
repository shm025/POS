import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useLang } from '../contexts/LangContext'
import { notify } from '../utils/notify'

export function useReservations(companyId) {
  const { t } = useLang()
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
      const { error } = await supabase.from('reservations').update(data).eq('id', editId)
      if (error) { notify(t('save_error') + ': ' + error.message, 'error'); return false }
    } else {
      const { error } = await supabase.from('reservations').insert(data)
      if (error) { notify(t('save_error') + ': ' + error.message, 'error'); return false }
    }
    notify(t('notify_reservation_saved'))
    await loadReservations(filters)
    return true
  }, [companyId, loadReservations, t])

  const markDone = useCallback(async (id, filters = {}) => {
    await supabase.from('reservations').update({ status: 'done' }).eq('id', id)
    notify(t('notify_reservation_done'))
    await loadReservations(filters)
  }, [loadReservations, t])

  const deleteReservation = useCallback(async (id, filters = {}) => {
    if (!confirm(t('confirm_delete'))) return
    await supabase.from('reservations').delete().eq('id', id)
    notify(t('notify_deleted'))
    await loadReservations(filters)
  }, [loadReservations, t])

  return { reservations, loading, loadReservations, saveReservation, markDone, deleteReservation }
}
