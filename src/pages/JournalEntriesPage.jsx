import { useState, useEffect } from 'react'
import { useJournalEntries } from '../hooks/useJournalEntries'
import { useAccounts } from '../hooks/useAccounts'
import { useLang } from '../contexts/LangContext'
import Modal from '../components/common/Modal'
import { fmt } from '../utils/format'

export default function JournalEntriesPage() {
  const { t } = useLang()
  const { entries, loading, loadEntries, saveEntry, deleteEntry } = useJournalEntries()
  const { accounts, loadAccounts } = useAccounts()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], desc:'', debitAccId:'', creditAccId:'', amount:0 })

  useEffect(() => { loadEntries(); loadAccounts() }, [loadEntries, loadAccounts])

  async function handleSave() {
    const dA = parseInt(form.debitAccId)
    const cA = parseInt(form.creditAccId)
    const amt = parseFloat(form.amount) || 0
    if (!dA || !cA || !amt) { return }
    await saveEntry({ date:form.date, desc:form.desc, debitAccId:dA, creditAccId:cA, amount:amt })
    setModalOpen(false)
    setForm({ date: new Date().toISOString().split('T')[0], desc:'', debitAccId:'', creditAccId:'', amount:0 })
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const accOptions = accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>✏️ {t('journal_title')}</h1>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>➕ {t('new_entry_btn')}</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>#</th><th>{t('th_date')}</th><th>{t('th_desc')}</th><th>{t('th_debit')}</th><th>{t('th_credit')}</th><th className="no-print">{t('th_action')}</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign:'center', padding:'20px' }}>{t('loading')}</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan="6"><div className="empty-state"><div className="icon">✏️</div><p>{t('no_entries')}</p></div></td></tr>
              ) : [...entries].reverse().map(e => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.date}</td>
                  <td>{e.desc}</td>
                  <td style={{ color:'var(--success)', direction:'ltr' }}>${fmt(e.amount)}</td>
                  <td style={{ color:'var(--danger)', direction:'ltr' }}>${fmt(e.amount)}</td>
                  <td className="no-print">
                    <button className="btn btn-sm btn-danger" onClick={() => deleteEntry(e.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`✏️ ${t('new_entry_title')}`}
        footer={<><button className="btn btn-primary" onClick={handleSave}>💾 {t('save_btn')}</button><button className="btn btn-outline" onClick={() => setModalOpen(false)}>{t('cancel_btn')}</button></>}
      >
        <div className="grid-2">
          <div className="form-group"><label className="form-label">{t('lbl_date')}</label><input type="date" className="form-control" value={form.date} onChange={f('date')} /></div>
          <div className="form-group"><label className="form-label">{t('lbl_amount')}</label><input type="number" className="form-control" value={form.amount} onChange={f('amount')} /></div>
          <div className="form-group">
            <label className="form-label">{t('lbl_debit_acc')}</label>
            <select className="form-control" value={form.debitAccId} onChange={f('debitAccId')}>
              <option value="">{t('select_placeholder')}</option>{accOptions}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_credit_acc')}</label>
            <select className="form-control" value={form.creditAccId} onChange={f('creditAccId')}>
              <option value="">{t('select_placeholder')}</option>{accOptions}
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">{t('lbl_desc')}</label><input className="form-control" value={form.desc} onChange={f('desc')} /></div>
      </Modal>
    </div>
  )
}
