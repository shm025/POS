import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { notify } from '../utils/notify'

export function useBills(companyId) {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(false)

  async function loadBills() {
    if (!companyId) return
    setLoading(true)
    const { data } = await supabase
      .from('bills')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    setBills(data || [])
    setLoading(false)
  }

  async function saveBill(formData) {
    await supabase.from('bills').insert({ company_id: companyId, ...formData, paid: false })
    notify('تم حفظ الفاتورة')
    await loadBills()
  }

  async function togglePaid(id, currentPaid) {
    await supabase.from('bills').update({ paid: !currentPaid }).eq('id', id)
    notify(!currentPaid ? 'تم تأكيد الدفع ✅' : 'تم إلغاء الدفع')
    await loadBills()
  }

  async function deleteBill(id) {
    if (!confirm('حذف هذه الفاتورة؟')) return
    await supabase.from('bills').delete().eq('id', id)
    notify('تم الحذف')
    await loadBills()
  }

  return { bills, loading, loadBills, saveBill, togglePaid, deleteBill }
}
