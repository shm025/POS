import { useAuth } from '../../contexts/AuthContext'
import { fmt } from '../../utils/format'
import { numberToArabicWords } from '../../utils/format'

export default function DocPrintHeader({ docMeta, subtotal, afterDisc, total, totalQty, discount, tax }) {
  const { company } = useAuth()

  return (
    <>
      {/* Print-only header */}
      <div className="doc-print-header">
        <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid #ccc', marginBottom:0 }}>
          <tbody>
            <tr>
              <td style={{ width:'55%', verticalAlign:'top', padding:'10px 12px', borderRight:'1px solid #ccc' }}>
                <div style={{ fontSize:'16px', fontWeight:900, color:'#000' }}>{company?.name || 'CATALAN POS'}</div>
                <div style={{ fontSize:'11px', marginTop:'6px', color:'#333' }}>{company?.address || ''}</div>
                <div style={{ fontSize:'11px', color:'#333' }}>{company?.phone || ''}</div>
                <div style={{ marginTop:'10px' }}>
                  <table style={{ borderCollapse:'collapse', border:'1px solid #ccc', width:'100%' }}>
                    <tbody>
                      <tr>
                        <td style={{ border:'1px solid #ccc', padding:'3px 7px', fontSize:'11px', whiteSpace:'nowrap' }}>Acc. No. : <strong>{company?.acc_no || '4100026'}</strong></td>
                        <td style={{ border:'1px solid #ccc', padding:'3px 7px', fontSize:'11px' }}>VAT # :</td>
                        <td style={{ border:'1px solid #ccc', padding:'3px 7px', fontSize:'11px' }}>Order No. :</td>
                        <td style={{ border:'1px solid #ccc', padding:'3px 7px', fontSize:'11px', fontWeight:700 }}>Ref. No.: <strong id="print-ref">{docMeta.number}</strong></td>
                      </tr>
                      <tr>
                        <td colSpan="3" style={{ border:'1px solid #ccc', padding:'6px 7px', fontSize:'13px', fontWeight:700, textAlign:'center' }} id="print-customer">{docMeta.party}</td>
                        <td style={{ border:'1px solid #ccc', padding:'3px 7px', fontSize:'11px' }}>Date : <strong id="print-date">{docMeta.date}</strong></td>
                      </tr>
                      <tr>
                        <td colSpan="3" style={{ border:'1px solid #ccc', padding:'3px 7px', fontSize:'11px' }}></td>
                        <td style={{ border:'1px solid #ccc', padding:'3px 7px', fontSize:'11px' }}>V.Date : <strong>{docMeta.dueDate}</strong></td>
                      </tr>
                      <tr>
                        <td colSpan="3" style={{ border:'1px solid #ccc', padding:'3px 7px', fontSize:'11px' }}></td>
                        <td style={{ border:'1px solid #ccc', padding:'3px 7px', fontSize:'11px' }}>Rate : <strong>{company?.rate || '89,000'}</strong></td>
                      </tr>
                      <tr>
                        <td colSpan="3" style={{ border:'1px solid #ccc', padding:'3px 7px', fontSize:'11px' }}></td>
                        <td style={{ border:'1px solid #ccc', padding:'3px 7px', fontSize:'11px' }}>Sales Man : <strong>USER_1</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
              <td style={{ width:'45%', verticalAlign:'top', padding:'10px 12px' }}>
                <div style={{ textAlign:'center', fontSize:'18px', fontWeight:900, color:'#000', borderBottom:'2px solid #000', paddingBottom:'8px', marginBottom:'8px' }}>مبيع بالحساب</div>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ fontSize:'11px', padding:'3px 0' }}>Page : 1/1</td>
                      <td style={{ fontSize:'11px', textAlign:'right', padding:'3px 0' }}>Currency : <strong>USD</strong></td>
                    </tr>
                    <tr>
                      <td style={{ fontSize:'11px', padding:'3px 0' }}>Time : {new Date().toTimeString().slice(0,8)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Print-only totals table */}
      <table className="print-totals-table" style={{ width:'100%', marginTop:'16px', borderCollapse:'collapse' }}>
        <tbody>
          <tr>
            <td style={{ width:'60%', verticalAlign:'top', fontSize:'12px', padding:'4px' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid #999' }}>
                <tbody>
                  <tr style={{ background:'#e8e8e8' }}>
                    <td colSpan="4" style={{ padding:'4px 8px', fontWeight:700, textAlign:'center', border:'1px solid #999' }}>Amount in Words</td>
                  </tr>
                  <tr>
                    <td colSpan="4" style={{ padding:'6px 8px', fontSize:'11px', border:'1px solid #999' }}>
                      {numberToArabicWords(total)} دولار أمريكي لاغير
                    </td>
                  </tr>
                </tbody>
              </table>
              <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid #999', marginTop:'8px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding:'4px 8px', border:'1px solid #999', fontSize:'11px' }}>Old Balance</td>
                    <td style={{ padding:'4px 8px', border:'1px solid #999', fontSize:'11px', textAlign:'right', direction:'ltr' }}>0.00</td>
                  </tr>
                  <tr>
                    <td style={{ padding:'4px 8px', border:'1px solid #999', fontSize:'11px' }}>New Balance</td>
                    <td style={{ padding:'4px 8px', border:'1px solid #999', fontSize:'11px', textAlign:'right', direction:'ltr', fontWeight:700 }}>0.00</td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td style={{ width:'40%', verticalAlign:'top', paddingRight:0 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid #999' }}>
                <tbody>
                  <tr><td style={{ padding:'4px 8px', border:'1px solid #999', fontSize:'11px' }}>Total Qty</td><td style={{ padding:'4px 8px', border:'1px solid #999', fontSize:'11px', textAlign:'right' }}>{fmt(totalQty, 0)}</td></tr>
                  <tr><td style={{ padding:'4px 8px', border:'1px solid #999', fontSize:'11px' }}>Total Invoice</td><td style={{ padding:'4px 8px', border:'1px solid #999', fontSize:'11px', textAlign:'right', direction:'ltr' }}>{fmt(subtotal)}</td></tr>
                  <tr><td style={{ padding:'4px 8px', border:'1px solid #999', fontSize:'11px' }}>Discount %</td><td style={{ padding:'4px 8px', border:'1px solid #999', fontSize:'11px', textAlign:'right' }}>{fmt(discount, 2)}%</td></tr>
                  <tr><td style={{ padding:'4px 8px', border:'1px solid #999', fontSize:'11px' }}>Gross Total</td><td style={{ padding:'4px 8px', border:'1px solid #999', fontSize:'11px', textAlign:'right', direction:'ltr' }}>{fmt(afterDisc)}</td></tr>
                  <tr><td style={{ padding:'4px 8px', border:'1px solid #999', fontSize:'11px' }}>VAT %</td><td style={{ padding:'4px 8px', border:'1px solid #999', fontSize:'11px', textAlign:'right' }}>{fmt(tax, 2)}%</td></tr>
                  <tr style={{ background:'#e8e8e8' }}>
                    <td style={{ padding:'6px 8px', border:'1px solid #999', fontSize:'12px', fontWeight:700 }}>Net Total Invoice</td>
                    <td style={{ padding:'6px 8px', border:'1px solid #999', fontSize:'13px', fontWeight:900, textAlign:'right', direction:'ltr' }}>{fmt(total)}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop:'12px', fontSize:'11px' }}><strong>Signature:</strong></div>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  )
}
