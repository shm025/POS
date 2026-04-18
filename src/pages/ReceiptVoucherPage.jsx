import { useState, useEffect } from 'react'
import { useVouchers } from '../hooks/useVouchers'
import { useAccounts } from '../hooks/useAccounts'
import { useCustomers } from '../hooks/useCustomers'
import { useSuppliers } from '../hooks/useSuppliers'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import TypeaheadInput from '../components/common/TypeaheadInput'
import Modal from '../components/common/Modal'
import { fmt } from '../utils/format'
import { printVoucherWindow } from '../utils/printVoucher'

const EMPTY_FORM = {
  number: '', amount: 0,
  date: new Date().toISOString().split('T')[0],
  debitAcc: '', creditAcc: '', desc: '',
}

export default function ReceiptVoucherPage() {
  const { company } = useAuth()
  const { t } = useLang()
  const { vouchers, loading, loadVouchers, saveVoucher, updateVoucher, deleteVoucher } = useVouchers(company?.id)
  const { accounts, loadAccounts } = useAccounts(company?.id)
  const { customers, loadCustomers } = useCustomers(company?.id)
  const { suppliers, loadSuppliers } = useSuppliers(company?.id)

  const [form, setForm]           = useState(EMPTY_FORM)
  const [editId, setEditId]       = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    loadAccounts()
    loadCustomers()
    loadSuppliers()
    loadVouchers('receipt').then(v => {
      setForm(p => ({ ...p, number: `RCV-${new Date().getFullYear()}-${String(v.length + 1).padStart(3, '0')}` }))
    })
  }, [loadVouchers, loadAccounts, loadCustomers, loadSuppliers])

  async function handleSave() {
    if (!form.amount || !form.debitAcc || !form.creditAcc) return
    const payload = { ...form, type: 'receipt', party: form.debitAcc, method: `${form.debitAcc} | ${form.creditAcc}`, amount: parseFloat(form.amount) || 0 }
    if (editId) {
      const ok = await updateVoucher(editId, payload)
      if (ok) closeModal()
    } else {
      await saveVoucher(payload)
      const v = await loadVouchers('receipt')
      setForm({ ...EMPTY_FORM, number: `RCV-${new Date().getFullYear()}-${String(v.length + 1).padStart(3, '0')}` })
      setModalOpen(false)
    }
  }

  function openEdit(v) {
    const [debit, credit] = (v.method || '').split(' | ')
    setForm({
      number:    v.number || '',
      amount:    v.amount || 0,
      date:      v.date   || new Date().toISOString().split('T')[0],
      debitAcc:  debit   || v.party || '',
      creditAcc: credit  || '',
      desc:      v.description || '',
    })
    setEditId(v.id)
    setModalOpen(true)
  }

  function closeModal() {
    setEditId(null)
    setModalOpen(false)
    loadVouchers('receipt').then(v =>
      setForm({ ...EMPTY_FORM, number: `RCV-${new Date().getFullYear()}-${String(v.length + 1).padStart(3, '0')}` })
    )
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const partyItems = [
    ...accounts.map(a  => ({ id: a.id, code: a.code,    name: a.name, _type: 'account'  })),
    ...customers.map(c => ({ id: c.id, code: c.code||'', name: c.name, _type: 'customer' })),
    ...suppliers.map(s => ({ id: s.id, code: s.code||'', name: s.name, _type: 'supplier' })),
  ]
  const typeLabel = { account: t('type_account'), customer: t('type_customer'), supplier: t('type_supplier') }

  return (
    <div className="page-view">
      <div className="flex-between mb-4">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>💵 {t('receipt_title')}</h1>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setModalOpen(true) }}>
          ➕ {t('new_receipt_title')}
        </button>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">📋 {t('recent_vouchers')}</div></div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t('th_number')}</th>
                <th>{t('th_date')}</th>
                <th>{t('th_debit')}</th>
                <th>{t('th_credit')}</th>
                <th>{t('th_amount')}</th>
                <th style={{ width:'110px' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign:'center', padding:'20px' }}><div className="loading-spinner"></div></td></tr>
              ) : vouchers.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign:'center', padding:'20px', color:'var(--text-muted)' }}>{t('no_vouchers')}</td></tr>
              ) : vouchers.map((v, i) => (
                <tr key={i}>
                  <td style={{ fontSize:'12px', direction:'ltr', fontWeight:600, color:'var(--primary)' }}>{v.number}</td>
                  <td style={{ fontSize:'12px' }}>{v.date}</td>
                  <td style={{ fontSize:'12px' }}>{v.method?.split(' | ')[0] || '—'}</td>
                  <td style={{ fontSize:'12px' }}>{v.method?.split(' | ')[1] || '—'}</td>
                  <td style={{ direction:'ltr', fontWeight:700 }}>${fmt(v.amount)}</td>
                  <td>
                    <div style={{ display:'flex', gap:'4px' }}>
                      <button className="btn btn-sm btn-outline" title="Print" onClick={() => printVoucherWindow(v, company, 'receipt')}>🖨</button>
                      <button className="btn btn-sm btn-outline" title="Edit"  onClick={() => openEdit(v)}>✏️</button>
                      <button className="btn btn-sm btn-danger"  title="Delete" onClick={() => deleteVoucher(v.id, 'receipt')}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editId ? '✏️ Edit Receipt Voucher' : `💵 ${t('new_receipt_title')}`}
        footer={
          <>
            <button className="btn btn-success" onClick={handleSave}>💾 {t('save_voucher_btn')}</button>
            <button className="btn btn-outline" onClick={closeModal}>{t('btn_cancel')}</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">{t('lbl_voucher_no')}</label>
          <input className="form-control" value={form.number} onChange={f('number')} style={{ direction:'ltr' }} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('lbl_amount')}</label>
          <input type="number" className="form-control" value={form.amount} onChange={f('amount')} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('lbl_date')}</label>
          <input type="date" className="form-control" value={form.date} onChange={f('date')} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('lbl_debit_acc')}</label>
          <TypeaheadInput
            value={form.debitAcc}
            onChange={v => setForm(p => ({ ...p, debitAcc: v }))}
            onSelect={a => setForm(p => ({ ...p, debitAcc: a.code ? `${a.code} - ${a.name}` : a.name }))}
            items={partyItems} placeholder={t('ph_code_or_name')}
            renderItem={a => <><span>{a.code ? `${a.code} - ` : ''}{a.name}</span><span className="item-code">{typeLabel[a._type]}</span></>}
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t('lbl_credit_acc')}</label>
          <TypeaheadInput
            value={form.creditAcc}
            onChange={v => setForm(p => ({ ...p, creditAcc: v }))}
            onSelect={a => setForm(p => ({ ...p, creditAcc: a.code ? `${a.code} - ${a.name}` : a.name }))}
            items={partyItems} placeholder={t('ph_code_or_name')}
            renderItem={a => <><span>{a.code ? `${a.code} - ` : ''}{a.name}</span><span className="item-code">{typeLabel[a._type]}</span></>}
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t('lbl_desc')}</label>
          <textarea className="form-control" rows="2" value={form.desc} onChange={f('desc')} />
        </div>
      </Modal>
    </div>
  )
}
