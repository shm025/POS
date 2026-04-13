import { useState, useEffect } from 'react'
import { dbGetAll } from '../lib/db'
import { fmt } from '../utils/format'

export default function TrialBalancePage() {
  const [accounts, setAccounts] = useState([])
  const [company, setCompany] = useState('')

  useEffect(() => { dbGetAll('accounts').then(setAccounts) }, [])

  const totalDebit = accounts.reduce((s, a) => s + (a.debit || 0), 0)
  const totalCredit = accounts.reduce((s, a) => s + (a.credit || 0), 0)

  return (
    <div className="page-view">
      <div className="flex-between mb-4 no-print">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>⚖️ ميزان المراجعة</h1>
        <button className="btn btn-outline" onClick={() => window.print()}>🖨 طباعة</button>
      </div>

      <div className="card">
        <div style={{ textAlign:'center', marginBottom:'20px' }}>
          <div style={{ fontSize:'18px', fontWeight:900 }} id="trial-co-name">CATALAN POS</div>
          <div style={{ fontSize:'14px', color:'var(--text-muted)' }}>ميزان المراجعة — {new Date().toLocaleDateString('ar-LB')}</div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>الكود</th><th>الاسم</th><th>مدين</th><th>دائن</th></tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.id}>
                  <td>{a.code}</td>
                  <td>{a.name}</td>
                  <td style={{ direction:'ltr' }}>{a.debit ? fmt(a.debit) : '-'}</td>
                  <td style={{ direction:'ltr' }}>{a.credit ? fmt(a.credit) : '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight:900, background:'var(--bg-panel)' }}>
                <td colSpan="2" style={{ textAlign:'center' }}>الإجمالي</td>
                <td style={{ direction:'ltr', color:'var(--success)' }}>{fmt(totalDebit)}</td>
                <td style={{ direction:'ltr', color:'var(--danger)' }}>{fmt(totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
