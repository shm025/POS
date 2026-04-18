import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import { fmt } from '../../utils/format'
import { numberToArabicWords } from '../../utils/format'

const DOC_LABEL = {
  invoices:           { ar: 'مبيع بالحساب',    en: 'Sales Invoice'      },
  'sales-return':     { ar: 'مرتجع مبيعات',    en: 'Sales Return'       },
  orders:             { ar: 'عرض سعر',          en: 'Quotation / Order'  },
  purchases:          { ar: 'فاتورة مشتريات',   en: 'Purchase Invoice'   },
  'purchases-return': { ar: 'مرتجع مشتريات',   en: 'Purchase Return'    },
}

/* shared cell styles */
const td  = { border:'1px solid #999', padding:'3px 6px', fontSize:'10px' }
const tdB = { border:'1px solid #999', padding:'3px 6px', fontSize:'10px', fontWeight:700 }
const tdG = { border:'1px solid #999', padding:'3px 6px', fontSize:'10px', background:'#e8e8e8' }

export default function DocPrintHeader({ docType, docMeta, subtotal, afterDisc, total, totalQty, discount, tax }) {
  const { company } = useAuth()
  const { t }       = useLang()

  const label   = DOC_LABEL[docType] || { ar: '', en: docType }
  const rate    = parseFloat(company?.exchange_rate || 89500)
  const totalLL = Math.round(total * rate)
  const now     = new Date()
  const timeStr = now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
  const dateStr = docMeta.date || now.toLocaleDateString('en-GB')

  return (
    <>
      {/* ═══════════════════════════════════════════
          PRINT HEADER
      ═══════════════════════════════════════════ */}
      <div className="doc-print-header">

        {/* Company name + phones — above the table, no border */}
        <div style={{ marginBottom:'4px' }}>
          <div style={{ fontSize:'15px', fontWeight:900, color:'#000' }}>
            {company?.name || 'Company'}
            {company?.name_en ? <span style={{ fontSize:'12px', fontWeight:400, marginRight:'10px', color:'#444' }}> — {company.name_en}</span> : null}
          </div>
          {company?.phone && (
            <div style={{ fontSize:'10px', color:'#444', marginTop:'2px', direction:'ltr' }}>{company.phone}</div>
          )}
          {company?.address && (
            <div style={{ fontSize:'10px', color:'#555' }}>{company.address}</div>
          )}
        </div>

        {/* ── Main info table ── */}
        <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid #999' }}>
          <tbody>

            {/* Row 1: Acc No | VAT # | Order No | Ref No */}
            <tr>
              <td style={{ ...td, width:'22%' }}>
                Acc. No. : <strong>{company?.acc_no || '—'}</strong>
              </td>
              <td style={{ ...td, width:'22%' }}>VAT # :</td>
              <td style={{ ...td, width:'22%' }}>Order No. :</td>
              <td style={{ ...tdB, width:'34%', color:'#1a1a1a', textAlign:'right', direction:'ltr' }}>
                Ref. No. : <span id="print-ref">{docMeta.number}</span>
              </td>
            </tr>

            {/* Row 2: Customer (3 cols) | Date */}
            <tr>
              <td colSpan="3" style={{ ...td, textAlign:'center', fontSize:'13px', fontWeight:700 }} id="print-customer">
                {docMeta.party || '—'}
              </td>
              <td style={td}>Date : <strong>{dateStr}</strong></td>
            </tr>

            {/* Row 3: empty | V.Date */}
            <tr>
              <td colSpan="3" style={{ ...td, height:'16px' }}>&nbsp;</td>
              <td style={td}>V.Date : <strong>{docMeta.dueDate || dateStr}</strong></td>
            </tr>

            {/* Row 4: warehouse/notes | Rate */}
            <tr>
              <td colSpan="3" style={{ ...td, fontSize:'9px', color:'#555' }}>
                {docMeta.warehouse ? `Warehouse: ${docMeta.warehouse}` : '-'}
              </td>
              <td style={td}>Rate : <strong>{rate.toLocaleString()}</strong></td>
            </tr>

            {/* Row 5: Page | Doc type (bold, bilingual) | Sales Man + Time */}
            <tr>
              <td style={{ ...tdG, fontSize:'10px' }}>Page : 1/1</td>
              <td colSpan="2" style={{ ...tdG, textAlign:'center', fontSize:'12px', fontWeight:900 }}>
                {label.ar}
              </td>
              <td style={td}>
                <div>Sales Man : <strong>USER_1</strong></div>
                <div>Time : {timeStr}</div>
                <div>Currency : <strong>{company?.currency || 'USD'}</strong></div>
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      {/* ═══════════════════════════════════════════
          PRINT FOOTER  (rendered after items via CSS order)
      ═══════════════════════════════════════════ */}
      <table className="print-totals-table" style={{ width:'100%', marginTop:'6px', borderCollapse:'collapse' }}>
        <tbody>

          {/* Signature label row */}
          <tr>
            <td colSpan="5" style={{ ...td, fontWeight:700, fontSize:'11px' }}>Signature</td>
            <td colSpan="3" style={{ ...td, textAlign:'right', fontWeight:700, fontSize:'11px' }}>
              {company?.currency || 'USD'}
            </td>
          </tr>

          {/* Total Qty + Total Invoice */}
          <tr>
            <td colSpan="2" style={{ ...td, color:'transparent' }}>—</td>
            <td style={{ ...tdG, textAlign:'center', fontSize:'10px' }}>
              Total Qty : <strong>{fmt(totalQty, 0)}</strong>
            </td>
            <td style={tdG}>Total Invoice</td>
            <td colSpan="2" style={{ ...td, textAlign:'right', direction:'ltr' }}>{fmt(subtotal)}</td>
            <td colSpan="2" style={{ ...td }}></td>
          </tr>

          {/* USD | L.L labels + Discount */}
          <tr>
            <td style={{ ...tdG, textAlign:'center' }}>USD</td>
            <td style={{ ...tdG, textAlign:'center' }}>L.L</td>
            <td style={td}></td>
            <td style={tdG}>Discount %</td>
            <td colSpan="2" style={{ ...td, textAlign:'right' }}>{fmt(discount, 2)}</td>
            <td colSpan="2" style={td}></td>
          </tr>

          {/* Old Balance */}
          <tr>
            <td style={tdG}>Old Balance</td>
            <td style={{ ...td, textAlign:'right', direction:'ltr' }}>0.00</td>
            <td style={{ ...td, textAlign:'right', direction:'ltr' }}>0.00</td>
            <td style={tdG}>Gross Total</td>
            <td colSpan="2" style={{ ...td, textAlign:'right', direction:'ltr' }}>{fmt(afterDisc)}</td>
            <td colSpan="2" style={td}></td>
          </tr>

          {/* New Balance */}
          <tr>
            <td style={tdG}>New Balance</td>
            <td style={{ ...td, textAlign:'right', direction:'ltr' }}>{fmt(total)}</td>
            <td style={{ ...td, textAlign:'right', direction:'ltr' }}>{totalLL.toLocaleString()}</td>
            <td style={tdG}>VAT %</td>
            <td style={{ ...td, textAlign:'right' }}>{fmt(tax, 2)}</td>
            <td style={{ ...tdB, textAlign:'center', background:'#d0d0d0', fontSize:'10px' }}>
              Net Total Invoice
            </td>
            <td colSpan="2" style={{ ...tdB, textAlign:'right', direction:'ltr', fontSize:'12px', background:'#d0d0d0' }}>
              {fmt(total)}
            </td>
          </tr>

          {/* Amount in Arabic words — full width */}
          <tr>
            <td colSpan="8" style={{ ...td, textAlign:'right', fontSize:'10px', fontWeight:600 }}>
              {numberToArabicWords(total)} {t('amount_in_words_suffix')}
            </td>
          </tr>

        </tbody>
      </table>
    </>
  )
}
