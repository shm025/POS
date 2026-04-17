import { useState, useEffect } from 'react'
import { useJournalEntries } from '../../hooks/useJournalEntries'
import { useAccounts } from '../../hooks/useAccounts'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import { fmt } from '../../utils/format'

let _rowId = 0
const newLine = () => ({ _id: ++_rowId, debitAccId: '', creditAccId: '', amount: '', desc: '' })

export default function JournalEntriesPage() {
  const { company } = useAuth()
  const { t } = useLang()
  const { entries, loading, loadEntries, saveBatchEntries, deleteDate } = useJournalEntries(company?.id)
  const { accounts, loadAccounts } = useAccounts(company?.id)

  const [date, setDate]   = useState(new Date().toISOString().split('T')[0])
  const [lines, setLines] = useState([newLine()])
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadEntries(); loadAccounts() }, [loadEntries, loadAccounts])

  // Group entries by date for history panel
  const byDate = {}
  entries.forEach(e => {
    if (!byDate[e.date]) byDate[e.date] = []
    byDate[e.date].push(e)
  })
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  function loadDate(d) {
    setDate(d)
    const dateEntries = byDate[d] || []
    if (dateEntries.length === 0) {
      setLines([newLine()])
    } else {
      setLines(dateEntries.map(e => ({
        _id:         ++_rowId,
        debitAccId:  e.debitAccId  || '',
        creditAccId: e.creditAccId || '',
        amount:      e.amount || '',
        desc:        e.desc   || '',
      })))
    }
  }

  function addLine()        { setLines(p => [...p, newLine()]) }
  function removeLine(_id)  { setLines(p => p.length > 1 ? p.filter(l => l._id !== _id) : p) }
  function setField(_id, k, v) { setLines(p => p.map(l => l._id === _id ? { ...l, [k]: v } : l)) }

  async function handleSave() {
    setSaving(true)
    await saveBatchEntries(date, lines)
    setSaving(false)
  }

  const totalAmt = lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0)

  const accOptions = [
    <option key="" value="">{t('journal_select_acc')}</option>,
    ...accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>),
  ]

  return (
    <div className="page-view">
      <div className="flex-between mb-4">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>✏️ {t('journal_title')}</h1>
      </div>

      {/* ── Editor ── */}
      <div className="card" style={{ marginBottom:'20px' }}>
        <div className="card-header">
          <div className="card-title">📋 {t('journal_enter_title')}</div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <input
              type="date"
              className="form-control"
              style={{ width:'160px' }}
              value={date}
              onChange={e => loadDate(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width:'3%' }}>#</th>
                <th style={{ width:'25%' }}>{t('lbl_debit_acc')}</th>
                <th style={{ width:'25%' }}>{t('lbl_credit_acc')}</th>
                <th style={{ width:'12%' }}>{t('th_amount')}</th>
                <th style={{ width:'30%' }}>{t('th_desc')}</th>
                <th style={{ width:'5%' }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, idx) => (
                <tr key={l._id}>
                  <td style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'12px' }}>{idx + 1}</td>
                  <td>
                    <select
                      className="form-control"
                      style={{ fontSize:'12px', padding:'4px 6px' }}
                      value={l.debitAccId}
                      onChange={e => setField(l._id, 'debitAccId', e.target.value)}
                    >
                      {accOptions}
                    </select>
                  </td>
                  <td>
                    <select
                      className="form-control"
                      style={{ fontSize:'12px', padding:'4px 6px' }}
                      value={l.creditAccId}
                      onChange={e => setField(l._id, 'creditAccId', e.target.value)}
                    >
                      {accOptions}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control"
                      style={{ fontSize:'12px', padding:'4px 6px', direction:'ltr' }}
                      value={l.amount}
                      onChange={e => setField(l._id, 'amount', e.target.value)}
                      placeholder="0.00"
                    />
                  </td>
                  <td>
                    <input
                      className="form-control"
                      style={{ fontSize:'12px', padding:'4px 6px' }}
                      value={l.desc}
                      onChange={e => setField(l._id, 'desc', e.target.value)}
                      placeholder={t('lbl_desc_placeholder')}
                    />
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => removeLine(l._id)}
                      disabled={lines.length === 1}
                    >🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background:'var(--bg-panel)', fontWeight:700 }}>
                <td colSpan="3" style={{ textAlign:'left', padding:'6px 8px', fontSize:'12px' }}>
                  <button className="btn btn-sm btn-outline" onClick={addLine}>➕ {t('journal_add_line')}</button>
                </td>
                <td style={{ padding:'6px 8px', fontSize:'13px', direction:'ltr', color:'var(--primary)' }}>
                  {fmt(totalAmt)}
                </td>
                <td colSpan="2" style={{ padding:'6px 8px', textAlign:'left' }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ minWidth:'120px' }}
                  >
                    {saving ? '...' : `💾 ${t('journal_save_date')} ${date}`}
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── History ── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">🗂 {t('journal_history_title')}</div>
        </div>

        {loading ? (
          <div style={{ padding:'20px', textAlign:'center' }}><div className="loading-spinner"></div></div>
        ) : sortedDates.length === 0 ? (
          <div className="empty-state"><div className="icon">✏️</div><p>{t('journal_no_saved')}</p></div>
        ) : sortedDates.map(d => {
          const rows = byDate[d]
          const dayTotal = rows.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
          const isActive = d === date
          return (
            <div
              key={d}
              style={{
                borderBottom:'1px solid var(--border-light)',
                background: isActive ? 'var(--bg-panel)' : 'transparent',
              }}
            >
              {/* Date header row */}
              <div
                className="flex-between"
                style={{ padding:'8px 16px', cursor:'pointer' }}
                onClick={() => loadDate(d)}
              >
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <span style={{ fontWeight:700, color: isActive ? 'var(--primary)' : 'inherit' }}>
                    📅 {d}
                  </span>
                  <span className="badge badge-secondary">{rows.length} {t('journal_entry_unit')}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <span style={{ fontWeight:700, direction:'ltr', color:'var(--primary)' }}>{fmt(dayTotal)}</span>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={e => { e.stopPropagation(); loadDate(d) }}
                  >✏️ {t('edit_btn')}</button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={e => { e.stopPropagation(); deleteDate(d) }}
                  >🗑</button>
                </div>
              </div>

              {/* Entry lines for this date */}
              {isActive && (
                <div style={{ padding:'0 16px 12px' }}>
                  <table style={{ width:'100%', fontSize:'12px', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ color:'var(--text-muted)', fontSize:'11px' }}>
                        <th style={{ padding:'3px 6px', textAlign:'right', fontWeight:400 }}>{t('th_debit')}</th>
                        <th style={{ padding:'3px 6px', textAlign:'right', fontWeight:400 }}>{t('th_credit')}</th>
                        <th style={{ padding:'3px 6px', textAlign:'right', fontWeight:400 }}>{t('th_amount')}</th>
                        <th style={{ padding:'3px 6px', textAlign:'right', fontWeight:400 }}>{t('th_desc')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(e => {
                        const dr = accounts.find(a => a.id === e.debitAccId)
                        const cr = accounts.find(a => a.id === e.creditAccId)
                        return (
                          <tr key={e.id} style={{ borderTop:'1px solid var(--border-light)' }}>
                            <td style={{ padding:'3px 6px' }}>{dr ? `${dr.code} - ${dr.name}` : e.debitAccId}</td>
                            <td style={{ padding:'3px 6px' }}>{cr ? `${cr.code} - ${cr.name}` : e.creditAccId}</td>
                            <td style={{ padding:'3px 6px', direction:'ltr', color:'var(--success)', fontWeight:600 }}>{fmt(e.amount)}</td>
                            <td style={{ padding:'3px 6px', color:'var(--text-muted)' }}>{e.desc}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
