import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import { supabase } from '../../lib/supabase'
import { fmt, numberToArabicWords } from '../../utils/format'

const PURCHASE_TYPES = ['purchases', 'purchases-return']

const td  = { border:'1px solid #999', padding:'3px 6px', fontSize:'10px' }
const tdB = { border:'1px solid #999', padding:'3px 6px', fontSize:'10px', fontWeight:700 }
const tdG = { border:'1px solid #999', padding:'3px 6px', fontSize:'10px', background:'#e8e8e8' }

export default function DocPrintFooter({ docType, docId, docMeta, subtotal, afterDisc, total, totalQty, discount, tax }) {
  const { company } = useAuth()
  const { t } = useLang()
  const [oldBalance, setOldBalance] = useState(0)

  const isPurchase = PURCHASE_TYPES.includes(docType)
  const rate     = parseFloat(company?.exchange_rate || 89500)
  const newBalance = oldBalance + total
  const oldBalLL   = Math.round(oldBalance * rate)
  const newBalLL   = Math.round(newBalance * rate)

  useEffect(() => {
    if (!company?.id || !docMeta.party) { setOldBalance(0); return }

    async function fetchBalance() {
      if (isPurchase) {
        const [{ data: invs }, { data: vouchers }] = await Promise.all([
          supabase.from('invoices').select('id, doc_type, total')
            .eq('company_id', company.id).eq('customer_name', docMeta.party)
            .in('doc_type', ['purchases', 'purchases-return']),
          supabase.from('vouchers').select('amount')
            .eq('company_id', company.id).eq('party', docMeta.party).eq('type', 'payment'),
        ])
        let bal = 0
        ;(invs || []).forEach(inv => {
          if (docId && inv.id === docId) return
          const amt = parseFloat(inv.total || 0)
          if (inv.doc_type === 'purchases') bal += amt; else bal -= amt
        })
        ;(vouchers || []).forEach(v => { bal -= parseFloat(v.amount || 0) })
        setOldBalance(Math.max(0, bal))
      } else {
        const [{ data: invs }, { data: vouchers }] = await Promise.all([
          supabase.from('invoices').select('id, doc_type, total')
            .eq('company_id', company.id).eq('customer_name', docMeta.party)
            .in('doc_type', ['invoices', 'sales-return']),
          supabase.from('vouchers').select('amount')
            .eq('company_id', company.id).eq('party', docMeta.party).eq('type', 'receipt'),
        ])
        let bal = 0
        ;(invs || []).forEach(inv => {
          if (docId && inv.id === docId) return
          const amt = parseFloat(inv.total || 0)
          if (inv.doc_type === 'invoices') bal += amt; else bal -= amt
        })
        ;(vouchers || []).forEach(v => { bal -= parseFloat(v.amount || 0) })
        setOldBalance(Math.max(0, bal))
      }
    }

    fetchBalance()
  }, [company?.id, docMeta.party, docId, isPurchase])

  return (
    <table className="print-totals-table" style={{ width:'100%', marginTop:'6px', borderCollapse:'collapse' }}>
      <colgroup>
        <col style={{ width:'5%'  }} />
        <col style={{ width:'15%' }} />
        <col style={{ width:'30%' }} />
        <col style={{ width:'10%' }} />
        <col style={{ width:'12%' }} />
        <col style={{ width:'6%'  }} />
        <col style={{ width:'6%'  }} />
        <col style={{ width:'12%' }} />
      </colgroup>
      <tbody>

        {/* Signature | USD */}
        <tr>
          <td colSpan="5" style={{ ...td, fontWeight:700, fontSize:'11px' }}>Signature</td>
          <td colSpan="3" style={{ ...td, textAlign:'right', fontWeight:700, fontSize:'11px' }}>
            {company?.currency || 'USD'}
          </td>
        </tr>

        {/* Total Qty | Total Invoice */}
        <tr>
          <td colSpan="2" style={{ ...td, borderColor:'transparent', background:'transparent' }}></td>
          <td style={{ ...tdG, textAlign:'center' }}>Total Qty : <strong>{fmt(totalQty, 0)}</strong></td>
          <td style={tdG}>Total Invoice</td>
          <td colSpan="2" style={{ ...td, textAlign:'right', direction:'ltr', fontWeight:600 }}>{fmt(subtotal)}</td>
          <td colSpan="2" style={td}></td>
        </tr>

        {/* USD | L.L labels | Discount % */}
        <tr>
          <td style={{ ...tdG, textAlign:'center' }}>USD</td>
          <td style={{ ...tdG, textAlign:'center' }}>L.L</td>
          <td style={td}></td>
          <td style={tdG}>Discount %</td>
          <td colSpan="2" style={{ ...td, textAlign:'right', direction:'ltr' }}>{fmt(discount, 2)}</td>
          <td colSpan="2" style={td}></td>
        </tr>

        {/* Old Balance | Gross Total */}
        <tr>
          <td style={tdG}>Old Balance</td>
          <td style={{ ...td, textAlign:'right', direction:'ltr' }}>{fmt(oldBalance)}</td>
          <td style={{ ...td, textAlign:'right', direction:'ltr' }}>{oldBalLL.toLocaleString()}</td>
          <td style={tdG}>Gross Total</td>
          <td colSpan="2" style={{ ...td, textAlign:'right', direction:'ltr', fontWeight:600 }}>{fmt(afterDisc)}</td>
          <td colSpan="2" style={td}></td>
        </tr>

        {/* New Balance | VAT | Net Total */}
        <tr>
          <td style={tdG}>New Balance</td>
          <td style={{ ...td, textAlign:'right', direction:'ltr', fontWeight:700 }}>{fmt(newBalance)}</td>
          <td style={{ ...td, textAlign:'right', direction:'ltr', fontWeight:700 }}>{newBalLL.toLocaleString()}</td>
          <td style={tdG}>VAT %</td>
          <td style={{ ...td, textAlign:'right', direction:'ltr' }}>{fmt(tax, 2)}</td>
          <td style={{ ...tdB, textAlign:'center', background:'#d0d0d0' }}>Net Total Invoice</td>
          <td colSpan="2" style={{ ...tdB, textAlign:'right', direction:'ltr', fontSize:'12px', background:'#d0d0d0' }}>
            {fmt(total)}
          </td>
        </tr>

        {/* Arabic amount in words */}
        <tr>
          <td colSpan="8" style={{ ...td, textAlign:'right', fontSize:'10px', fontWeight:600, direction:'rtl' }}>
            {numberToArabicWords(total)} {t('amount_in_words_suffix')}
          </td>
        </tr>

      </tbody>
    </table>
  )
}
