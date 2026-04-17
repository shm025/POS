import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import { useItems } from '../../hooks/useItems'
import { useCustomers } from '../../hooks/useCustomers'
import { processCheckout } from '../../lib/checkout'
import { formatCurrency, fmt, fmtInt } from '../../utils/format'
import { notify } from '../../utils/notify'

export default function POSPage() {
  const { company, profile } = useAuth()
  const { t } = useLang()
  const { searchItems } = useItems(company?.id)
  const { searchByPhone } = useCustomers(company?.id)

  const PAYMENT_METHODS = [
    { value: 'cash_usd', label: t('pay_cash_usd') },
    { value: 'cash_lbp', label: t('pay_cash_lbp') },
    { value: 'card',     label: t('pay_card') },
    { value: 'loyalty',  label: t('pay_loyalty') },
  ]

  const exchangeRate = company?.exchange_rate || 89500

  // Cart
  const [cart, setCart] = useState([])
  // Search
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const searchRef = useRef(null)
  // Customer
  const [customerPhone, setCustomerPhone] = useState('')
  const [customer, setCustomer] = useState(null)
  const [customerResults, setCustomerResults] = useState([])
  // Payment modal
  const [showPayment, setShowPayment] = useState(false)
  const [payMethod, setPayMethod] = useState('cash_usd')
  const [paidUSD, setPaidUSD] = useState('')
  const [paidLBP, setPaidLBP] = useState('')
  // Receipt modal
  const [receipt, setReceipt] = useState(null)
  const [processing, setProcessing] = useState(false)

  // Auto-search items
  useEffect(() => {
    if (!query || query.length < 1) { setResults([]); return }
    const timer = setTimeout(async () => {
      const data = await searchItems(query)
      setResults(data)
    }, 200)
    return () => clearTimeout(timer)
  }, [query, searchItems])

  // Customer phone search
  useEffect(() => {
    if (!customerPhone || customerPhone.length < 3) { setCustomerResults([]); return }
    const timer = setTimeout(async () => {
      const data = await searchByPhone(customerPhone)
      setCustomerResults(data)
    }, 300)
    return () => clearTimeout(timer)
  }, [customerPhone, searchByPhone])

  function addToCart(item) {
    setCart(prev => {
      const existing = prev.find(r => r.item_id === item.id)
      if (existing) {
        return prev.map(r => r.item_id === item.id
          ? { ...r, qty: r.qty + 1, total: (r.qty + 1) * r.unit_price * (1 - r.discount / 100) }
          : r
        )
      }
      return [...prev, {
        item_id: item.id,
        name: item.name,
        unit: item.unit || 'piece',
        unit_price: item.selling_price || 0,
        cost_price: item.cost_price || 0,
        qty: 1,
        discount: 0,
        total: item.selling_price || 0,
        tax_rate: item.tax_rate || 0,
        stock: item.stock,
      }]
    })
    setQuery('')
    setResults([])
    searchRef.current?.focus()
  }

  function updateQty(item_id, qty) {
    const q = Math.max(0, parseInt(qty) || 0)
    if (q === 0) { setCart(prev => prev.filter(r => r.item_id !== item_id)); return }
    setCart(prev => prev.map(r => r.item_id === item_id
      ? { ...r, qty: q, total: q * r.unit_price * (1 - r.discount / 100) }
      : r
    ))
  }

  function updateDiscount(item_id, disc) {
    const d = Math.min(100, Math.max(0, parseFloat(disc) || 0))
    setCart(prev => prev.map(r => r.item_id === item_id
      ? { ...r, discount: d, total: r.qty * r.unit_price * (1 - d / 100) }
      : r
    ))
  }

  function removeFromCart(item_id) {
    setCart(prev => prev.filter(r => r.item_id !== item_id))
  }

  const subtotal = cart.reduce((s, r) => s + r.total, 0)
  const totalFormatted = formatCurrency(subtotal, exchangeRate)

  const paid_usd = parseFloat(paidUSD) || 0
  const paid_lbp = parseFloat(paidLBP) || 0
  const change = formatCurrency(Math.max(0, paid_usd - subtotal), exchangeRate)
  const changeLBP = Math.max(0, paid_lbp - totalFormatted.lbpRaw)

  async function handleCharge() {
    if (cart.length === 0) { notify(t('pos_cart_empty_error'), 'error'); return }
    setProcessing(true)
    try {
      const result = await processCheckout({
        company_id: company.id,
        cashier_id: profile?.id,
        customer_id: customer?.id || null,
        terminal_id: null,
        items: cart,
        payment_method: payMethod,
        paid_amount_usd: paid_usd,
        paid_amount_lbp: paid_lbp,
        exchange_rate_used: exchangeRate,
      })
      setReceipt({
        ...result,
        cart: [...cart],
        subtotal,
        payMethod,
        customer,
        exchangeRate,
        date: new Date().toLocaleString(),
      })
      setCart([])
      setCustomer(null)
      setCustomerPhone('')
      setShowPayment(false)
      setPaidUSD('')
      setPaidLBP('')
    } catch (err) {
      notify(t('pos_checkout_error') + ': ' + err.message, 'error')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 80px)', padding: '16px' }}>

      {/* Left: Search + Cart */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Search bar */}
        <div style={{ position: 'relative' }}>
          <input
            ref={searchRef}
            className="form-control"
            placeholder={`🔍 ${t('pos_search_placeholder')}`}
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ fontSize: '16px', padding: '12px' }}
            autoFocus
          />
          {results.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', maxHeight: '300px', overflowY: 'auto',
            }}>
              {results.map(item => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  style={{
                    padding: '10px 14px', cursor: 'pointer', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid var(--border-light)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-panel)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {item.barcode || item.code} • {t('pos_stock_label')}: {item.stock}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--success)', direction: 'ltr' }}>
                    ${fmt(item.selling_price)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="card" style={{ flex: 1, overflowY: 'auto' }}>
          {cart.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px' }}>
              <div className="icon">🛒</div>
              <p>{t('pos_empty_cart')}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t('pos_col_item')}</th>
                  <th style={{ width: '90px' }}>{t('pos_col_qty')}</th>
                  <th style={{ width: '90px' }}>{t('lbl_price')}</th>
                  <th style={{ width: '80px' }}>{t('pos_col_discount')}</th>
                  <th style={{ width: '110px' }}>{t('th_total')}</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {cart.map(row => {
                  const lineFmt = formatCurrency(row.total, exchangeRate)
                  return (
                    <tr key={row.item_id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{row.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {lineFmt.usd} / {lineFmt.lbp}
                        </div>
                      </td>
                      <td>
                        <input
                          type="number" min="1"
                          value={row.qty}
                          onChange={e => updateQty(row.item_id, e.target.value)}
                          style={{ width: '70px', padding: '4px 6px', border: '1px solid var(--border)', borderRadius: '6px', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ direction: 'ltr', fontWeight: 600 }}>${fmt(row.unit_price)}</td>
                      <td>
                        <input
                          type="number" min="0" max="100"
                          value={row.discount}
                          onChange={e => updateDiscount(row.item_id, e.target.value)}
                          style={{ width: '60px', padding: '4px 6px', border: '1px solid var(--border)', borderRadius: '6px', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--success)', direction: 'ltr' }}>${fmt(row.total)}</td>
                      <td>
                        <button className="btn btn-sm btn-danger" onClick={() => removeFromCart(row.item_id)}>✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right: Order summary */}
      <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Customer lookup */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '14px' }}>👤 {t('pos_customer_label')}</div>
          {customer ? (
            <div style={{ background: 'var(--bg-panel)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700 }}>{customer.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{customer.phone}</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                <span className={`badge badge-${customer.loyalty_tier === 'gold' ? 'warning' : customer.loyalty_tier === 'platinum' ? 'success' : 'secondary'}`}>
                  {customer.loyalty_tier}
                </span>
                <span style={{ marginRight: '8px' }}>🎯 {fmtInt(customer.loyalty_points)} {t('pay_loyalty')}</span>
              </div>
              <button className="btn btn-sm btn-outline" style={{ marginTop: '6px' }} onClick={() => setCustomer(null)}>✕</button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                placeholder={t('pos_phone_search')}
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                style={{ fontSize: '13px' }}
              />
              {customerResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }}>
                  {customerResults.map(c => (
                    <div
                      key={c.id}
                      onClick={() => { setCustomer(c); setCustomerPhone(''); setCustomerResults([]) }}
                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid var(--border-light)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-panel)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ color: 'var(--text-muted)', direction: 'ltr' }}>{c.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order total */}
        <div className="card" style={{ flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span>{t('pos_items_count_label')}</span>
              <span style={{ fontWeight: 600 }}>{cart.length} {t('pos_item_unit')} / {fmtInt(cart.reduce((s,r)=>s+r.qty,0))} {t('pos_qty_unit')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
              <span>{t('th_total')}</span>
              <span style={{ direction: 'ltr', color: 'var(--success)' }}>{totalFormatted.usd}</span>
            </div>
            <div style={{ textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)', direction: 'ltr' }}>
              {totalFormatted.lbp}
            </div>
          </div>
        </div>

        {/* Charge button */}
        <button
          className="btn btn-primary"
          style={{ fontSize: '18px', padding: '16px', borderRadius: '12px' }}
          onClick={() => setShowPayment(true)}
          disabled={cart.length === 0}
        >
          💳 {t('pos_charge_btn')} {totalFormatted.usd}
        </button>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="card" style={{ width: '400px', padding: '24px' }}>
            <h2 style={{ fontWeight: 900, marginBottom: '16px', fontSize: '18px' }}>💳 {t('pos_payment_title')}</h2>

            <div style={{ background: 'var(--bg-panel)', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--success)', direction: 'ltr' }}>{totalFormatted.usd}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', direction: 'ltr' }}>{totalFormatted.lbp}</div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('pos_pay_method_label')}</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.value}
                    className={`btn ${payMethod === m.value ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1, minWidth: '80px' }}
                    onClick={() => setPayMethod(m.value)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {(payMethod === 'cash_usd' || payMethod === 'card') && (
              <div className="form-group">
                <label className="form-label">{t('pos_paid_usd_label')}</label>
                <input
                  type="number" className="form-control"
                  value={paidUSD} onChange={e => setPaidUSD(e.target.value)}
                  placeholder={fmt(subtotal)}
                  style={{ fontSize: '18px', textAlign: 'center' }}
                  autoFocus
                />
                {paid_usd > subtotal && (
                  <div style={{ color: 'var(--success)', fontWeight: 700, marginTop: '6px', textAlign: 'center' }}>
                    {t('pos_change_label')}: {change.usd} / {change.lbp}
                  </div>
                )}
              </div>
            )}

            {payMethod === 'cash_lbp' && (
              <div className="form-group">
                <label className="form-label">{t('pos_paid_lbp_label')}</label>
                <input
                  type="number" className="form-control"
                  value={paidLBP} onChange={e => setPaidLBP(e.target.value)}
                  placeholder={String(totalFormatted.lbpRaw)}
                  style={{ fontSize: '18px', textAlign: 'center' }}
                  autoFocus
                />
                {changeLBP > 0 && (
                  <div style={{ color: 'var(--success)', fontWeight: 700, marginTop: '6px', textAlign: 'center' }}>
                    {t('pos_change_label')}: {formatCurrency(changeLBP / exchangeRate, exchangeRate).lbp}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, padding: '14px', fontSize: '16px' }}
                onClick={handleCharge}
                disabled={processing}
              >
                {processing ? t('pos_processing') : `✅ ${t('pos_confirm_pay')}`}
              </button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowPayment(false)}>{t('cancel_btn')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receipt && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="card" style={{ width: '380px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '32px' }}>✅</div>
              <div style={{ fontWeight: 900, fontSize: '18px', color: 'var(--success)' }}>{t('pos_success_title')}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{receipt.date}</div>
            </div>

            {receipt.customer && (
              <div style={{ background: 'var(--bg-panel)', padding: '10px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
                <strong>{receipt.customer.name}</strong>
                {receipt.points_earned > 0 && (
                  <div style={{ color: 'var(--success)', marginTop: '4px' }}>
                    🎯 +{fmtInt(receipt.points_earned)} {t('pos_points_earned_label')}
                  </div>
                )}
              </div>
            )}

            <div style={{ borderTop: '1px dashed var(--border)', borderBottom: '1px dashed var(--border)', padding: '12px 0', marginBottom: '12px' }}>
              {receipt.cart.map(row => (
                <div key={row.item_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span>{row.name} × {row.qty}</span>
                  <span style={{ direction: 'ltr' }}>${fmt(row.total)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '16px', marginBottom: '8px' }}>
              <span>{t('th_total')}</span>
              <span style={{ direction: 'ltr' }}>{formatCurrency(receipt.subtotal, receipt.exchangeRate).usd}</span>
            </div>
            <div style={{ textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', direction: 'ltr' }}>
              {formatCurrency(receipt.subtotal, receipt.exchangeRate).lbp}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => window.print()}>🖨 {t('print_btn')}</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setReceipt(null)}>{t('cancel_btn')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
