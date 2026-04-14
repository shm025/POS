import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { notify } from '../utils/notify'

export function useEmployees(companyId) {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)

  async function loadEmployees() {
    if (!companyId) return
    setLoading(true)
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId)
      .eq('active', true)
    setEmployees(data || [])
    setLoading(false)
  }

  async function saveEmployee(formData, editId) {
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
      await supabase.from('employees').update(data).eq('id', editId)
    } else {
      await supabase.from('employees').insert(data)
    }
    notify('تم حفظ الموظف بنجاح')
    await loadEmployees()
  }

  async function deleteEmployee(id) {
    if (!confirm('هل تريد حذف هذا الموظف؟')) return
    await supabase.from('employees').update({ active: false }).eq('id', id)
    notify('تم حذف الموظف')
    await loadEmployees()
  }

  return { employees, loading, loadEmployees, saveEmployee, deleteEmployee }
}
