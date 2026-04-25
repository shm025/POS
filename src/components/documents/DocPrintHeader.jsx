import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'

const DOC_LABEL = {
  invoices:           { ar: 'مبيع بالحساب',    en: 'Sales Invoice'      },
  'sales-return':     { ar: 'مرتجع مبيعات',    en: 'Sales Return'       },
  orders:             { ar: 'عرض سعر',          en: 'Quotation / Order'  },
  purchases:          { ar: 'فاتورة مشتريات',   en: 'Purchase Invoice'   },
  'purchases-return': { ar: 'مرتجع مشتريات',   en: 'Purchase Return'    },
}

const td  = { border:'1px solid #999', padding:'3px 6px', fontSize:'10px' }
const tdB = { border:'1px solid #999', padding:'3px 6px', fontSize:'10px', fontWeight:700 }
const tdG = { border:'1px solid #999', padding:'3px 6px', fontSize:'10px', background:'#e8e8e8' }

export default function DocPrintHeader({ docType, docMeta }) {
  const { company } = useAuth()
  const { t }       = useLang()

  const label   = DOC_LABEL[docType] || { ar: '', en: docType }
  const rate    = parseFloat(company?.exchange_rate || 89500)
  const now     = new Date()
  const timeStr = now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
  const dateStr = docMeta.date || now.toLocaleDateString('en-GB')

  return (
    <div className="doc-print-header">

      {/* Company name + phones */}
      <div style={{ marginBottom:'6px' }}>
        <div style={{ fontSize:'15px', fontWeight:900, color:'#000' }}>
          {company?.name || 'Company'}
          {company?.name_en
            ? <span style={{ fontSize:'12px', fontWeight:400, marginRight:'10px', color:'#444' }}> — {company.name_en}</span>
            : null}
        </div>
        {company?.phone && (
          <div style={{ fontSize:'10px', color:'#444', marginTop:'2px', direction:'ltr', whiteSpace:'pre-line' }}>
            {company.phone}
          </div>
        )}
        {company?.address && (
          <div style={{ fontSize:'10px', color:'#555' }}>{company.address}</div>
        )}
      </div>

      {/* Main info table */}
      <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid #999' }}>
        <tbody>

          {/* Row 1: Acc No | VAT # | Order No | Ref No */}
          <tr>
            <td style={{ ...td, width:'22%' }}>Acc. No. : <strong>{company?.acc_no || '—'}</strong></td>
            <td style={{ ...td, width:'22%' }}>VAT # :</td>
            <td style={{ ...td, width:'22%' }}>Order No. :</td>
            <td style={{ ...tdB, width:'34%', textAlign:'right', direction:'ltr' }}>
              Ref. No.: <span id="print-ref">{docMeta.number}</span>
            </td>
          </tr>

          {/* Row 2: Customer (3 cols) | Date */}
          <tr>
            <td colSpan="3" style={{ ...td, textAlign:'center', fontSize:'13px', fontWeight:700 }} id="print-customer">
              {docMeta.party || '—'}
            </td>
            <td style={td}>Date &nbsp;: <strong>{dateStr}</strong></td>
          </tr>

          {/* Row 3: empty | V.Date */}
          <tr>
            <td colSpan="3" style={{ ...td, height:'16px' }}>&nbsp;</td>
            <td style={td}>V.Date : <strong>{docMeta.dueDate || dateStr}</strong></td>
          </tr>

          {/* Row 4: warehouse | Rate */}
          <tr>
            <td colSpan="3" style={{ ...td, fontSize:'9px', color:'#555' }}>
              {docMeta.warehouse ? `Warehouse: ${docMeta.warehouse}` : '-'}
            </td>
            <td style={td}>Rate : <strong>{rate.toLocaleString()}</strong></td>
          </tr>

          {/* Row 5: Sales Man */}
          <tr>
            <td colSpan="3" style={{ ...td, height:'14px' }}>&nbsp;</td>
            <td style={td}>Sales Man : <strong>USER_1</strong></td>
          </tr>

          {/* Row 6: Time */}
          <tr>
            <td colSpan="3" style={{ ...td, height:'14px' }}>&nbsp;</td>
            <td style={td}>Time : <strong>{timeStr}</strong></td>
          </tr>

          {/* Row 7: Page | Doc type | Currency */}
          <tr>
            <td style={{ ...tdG, width:'22%' }}>Page : 1 / 1</td>
            <td colSpan="2" style={{ ...tdG, textAlign:'center', fontSize:'13px', fontWeight:900 }}>
              {label.ar}
            </td>
            <td style={{ ...tdB, textAlign:'right' }}>
              Currency : <strong>{company?.currency || 'USD'}</strong>
            </td>
          </tr>

        </tbody>
      </table>
    </div>
  )
}
