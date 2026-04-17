import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import { fmt } from '../../utils/format'
import { numberToArabicWords } from '../../utils/format'

const DOC_TITLE_KEY = {
  invoices:           'doc_type_invoices',
  'sales-return':     'doc_type_sales_return',
  orders:             'doc_type_orders',
  purchases:          'doc_type_purchases',
  'purchases-return': 'doc_type_purchases_return',
}

const S = {
  cell:  { border:'1px solid #999', padding:'2px 5px', fontSize:'9px' },
  cellB: { border:'1px solid #999', padding:'2px 5px', fontSize:'9px', fontWeight:700 },
  label: { border:'1px solid #999', padding:'2px 5px', fontSize:'9px', background:'#efefef', fontWeight:700 },
}

export default function DocPrintHeader({ docType, docMeta, subtotal, afterDisc, total, totalQty, discount, tax }) {
  const { company } = useAuth()
  const { t } = useLang()

  return (
    <>
      {/* ── Compact invoice header ── */}
      <div className="doc-print-header">
        <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid #999', fontSize:'9px' }}>
          <tbody>
            <tr>
              {/* Left — company info */}
              <td style={{ width:'55%', verticalAlign:'top', padding:'5px 8px', borderRight:'1px solid #999' }}>
                <div style={{ fontSize:'12px', fontWeight:900, color:'#000', marginBottom:'2px' }}>{company?.name || 'CATALAN POS'}</div>
                {company?.address && <div style={{ fontSize:'9px', color:'#333' }}>{company.address}</div>}
                {company?.phone  && <div style={{ fontSize:'9px', color:'#333' }}>{company.phone}</div>}

                <table style={{ borderCollapse:'collapse', border:'1px solid #999', width:'100%', marginTop:'4px' }}>
                  <tbody>
                    <tr>
                      <td style={S.cell}>Acc. No.: <strong>{company?.acc_no || '4100026'}</strong></td>
                      <td style={S.cell}>VAT #:</td>
                      <td style={S.cell}>Order No.:</td>
                      <td style={S.cellB}>Ref.: <strong id="print-ref">{docMeta.number}</strong></td>
                    </tr>
                    <tr>
                      <td colSpan="3" style={{ ...S.cell, fontSize:'11px', fontWeight:700, textAlign:'center' }} id="print-customer">{docMeta.party}</td>
                      <td style={S.cell}>Date: <strong id="print-date">{docMeta.date}</strong></td>
                    </tr>
                    <tr>
                      <td colSpan="3" style={S.cell}>V.Date: <strong>{docMeta.dueDate}</strong></td>
                      <td style={S.cell}>Rate: <strong>{company?.rate || '89,000'}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </td>

              {/* Right — document type + meta */}
              <td style={{ width:'45%', verticalAlign:'top', padding:'5px 8px' }}>
                <div style={{ textAlign:'center', fontSize:'14px', fontWeight:900, color:'#000', borderBottom:'1px solid #000', paddingBottom:'3px', marginBottom:'4px' }}>
                  {DOC_TITLE_KEY[docType] ? t(DOC_TITLE_KEY[docType]) : t('no_data')}
                </div>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'9px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding:'1px 0' }}>Page: 1/1</td>
                      <td style={{ textAlign:'right', padding:'1px 0' }}>Currency: <strong>USD</strong></td>
                    </tr>
                    <tr>
                      <td style={{ padding:'1px 0' }}>Time: {new Date().toTimeString().slice(0,8)}</td>
                      <td style={{ textAlign:'right', padding:'1px 0' }}>Sales Man: <strong>USER_1</strong></td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Compact totals footer ── */}
      <table className="print-totals-table" style={{ width:'100%', marginTop:'6px', borderCollapse:'collapse' }}>
        <tbody>
          <tr>
            <td style={{ width:'60%', verticalAlign:'top', paddingLeft:0, paddingRight:'6px' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid #999' }}>
                <tbody>
                  <tr><td style={{ ...S.label, textAlign:'center' }}>Amount in Words</td></tr>
                  <tr><td style={{ ...S.cell, fontSize:'9px' }}>{numberToArabicWords(total)} {t('amount_in_words_suffix')}</td></tr>
                </tbody>
              </table>
              <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid #999', marginTop:'4px' }}>
                <tbody>
                  <tr>
                    <td style={S.cell}>Old Balance</td>
                    <td style={{ ...S.cell, textAlign:'right', direction:'ltr' }}>0.00</td>
                  </tr>
                  <tr>
                    <td style={S.cell}>New Balance</td>
                    <td style={{ ...S.cellB, textAlign:'right', direction:'ltr' }}>0.00</td>
                  </tr>
                </tbody>
              </table>
            </td>

            <td style={{ width:'40%', verticalAlign:'top', paddingRight:0 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid #999' }}>
                <tbody>
                  <tr><td style={S.cell}>Total Qty</td>      <td style={{ ...S.cell, textAlign:'right' }}>{fmt(totalQty, 0)}</td></tr>
                  <tr><td style={S.cell}>Total Invoice</td>  <td style={{ ...S.cell, textAlign:'right', direction:'ltr' }}>{fmt(subtotal)}</td></tr>
                  <tr><td style={S.cell}>Discount %</td>     <td style={{ ...S.cell, textAlign:'right' }}>{fmt(discount, 2)}%</td></tr>
                  <tr><td style={S.cell}>Gross Total</td>    <td style={{ ...S.cell, textAlign:'right', direction:'ltr' }}>{fmt(afterDisc)}</td></tr>
                  <tr><td style={S.cell}>VAT %</td>          <td style={{ ...S.cell, textAlign:'right' }}>{fmt(tax, 2)}%</td></tr>
                  <tr style={{ background:'#e8e8e8' }}>
                    <td style={{ ...S.cellB, fontSize:'10px' }}>Net Total</td>
                    <td style={{ ...S.cellB, fontSize:'11px', textAlign:'right', direction:'ltr' }}>{fmt(total)}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop:'8px', fontSize:'9px' }}><strong>Signature:</strong></div>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  )
}
