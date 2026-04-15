import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useLang } from '../contexts/LangContext'
import { notify } from '../utils/notify'

export function useEmployees(companyId) {
  const { t } = useLang()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)

  const loadEmployees = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId)
      .eq('active', true)
    setEmployees(data || [])
    setLoading(false)
  }, [companyId])

  const saveEmployee = useCallback(async (formData, editId) => {
    const data = {
      company_id: companyId,
      name: formData.name,
      phone: formData.phone,
      level: formData.level,
      salary_type: formData.salary_type,
      base_salary: parseFloat(formData.base_salary) || 0,
      commission_rate: parseFloat(formData.commission_rate) || 0,
      calendar_color: formData.calendar_color || '#3B82F6',
      working_hours: formData.working_hours || null,
      active: true,
    }
    if (editId) {
      const { error } = await supabase.from('employees').update(data).eq('id', editId)
      if (error) { notify(t('save_error') + ': ' + error.message, 'error'); return false }
    } else {
      const { error } = await supabase.from('employees').insert(data)
      if (error) { notify(t('save_error') + ': ' + error.message, 'error'); return false }
    }
    notify(t('notify_saved'))
    await loadEmployees()
    return true
  }, [companyId, loadEmployees, t])

  const deleteEmployee = useCallback(async (id) => {
    if (!confirm(t('confirm_delete'))) return
    await supabase.from('employees').update({ active: false }).eq('id', id)
    notify(t('notify_deleted'))
    await loadEmployees()
  }, [loadEmployees, t])

  return { employees, loading, loadEmployees, saveEmployee, deleteEmployee }
}
