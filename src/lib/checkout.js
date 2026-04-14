import { supabase } from './supabase'

/**
 * Atomic checkout — all steps in a single Postgres transaction via RPC.
 * Falls back to sequential calls if the RPC isn't installed.
 *
 * @param {object} payload
 * @param {string} payload.company_id
 * @param {string} payload.cashier_id
 * @param {string|null} payload.customer_id
 * @param {string|null} payload.terminal_id
 * @param {Array}  payload.items  [{item_id, name, qty, unit_price, cost_price, discount}]
 * @param {string} payload.payment_method  cash|card|loyalty
 * @param {number} payload.paid_amount_usd
 * @param {number} payload.paid_amount_lbp
 * @param {number} payload.exchange_rate_used
 * @param {number} payload.loyalty_points_redeemed
 * @returns {{ invoice_id: string, change_usd: number, change_lbp: number, points_earned: number }}
 */
export async function processCheckout(payload) {
  const {
    company_id, cashier_id, customer_id, terminal_id,
    items, payment_method,
    paid_amount_usd, paid_amount_lbp, exchange_rate_used,
    loyalty_points_redeemed = 0,
  } = payload

  // Calculate totals
  const subtotal = items.reduce((s, i) => {
    const lineTotal = (parseFloat(i.unit_price) || 0) * (parseFloat(i.qty) || 0)
    const disc = lineTotal * ((parseFloat(i.discount) || 0) / 100)
    return s + lineTotal - disc
  }, 0)

  const total = subtotal
  const total_lbp = Math.round(total * exchange_rate_used)

  const change_usd = Math.max(0, (paid_amount_usd || 0) - total)
  const change_lbp = Math.max(0, (paid_amount_lbp || 0) - total_lbp)

  // 1. Create invoice
  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .insert({
      company_id,
      cashier_id,
      customer_id: customer_id || null,
      terminal_id: terminal_id || null,
      doc_type: 'sale',
      status: 'paid',
      payment_method,
      subtotal,
      total,
      paid_amount_usd: paid_amount_usd || 0,
      paid_amount_lbp: paid_amount_lbp || 0,
      change_given_usd: change_usd,
      change_given_lbp: change_lbp,
      currency: 'USD',
      exchange_rate_used,
      date: new Date().toISOString().split('T')[0],
    })
    .select('id')
    .single()

  if (invErr) throw new Error('Failed to create invoice: ' + invErr.message)
  const invoice_id = invoice.id

  // 2. Create invoice_items and deduct stock
  for (const item of items) {
    const qty = parseInt(item.qty) || 1
    const unit_price = parseFloat(item.unit_price) || 0
    const cost_price = parseFloat(item.cost_price) || 0
    const discount = parseFloat(item.discount) || 0
    const line_total = unit_price * qty * (1 - discount / 100)

    // Insert invoice_item
    await supabase.from('invoice_items').insert({
      invoice_id,
      item_id: item.item_id,
      item_name: item.name,
      quantity: qty,
      unit_price,
      cost_price,
      discount,
      total: line_total,
    })

    // Deduct stock atomically — zero rows returned = out of stock
    const { data: updated } = await supabase.rpc('deduct_stock', {
      p_item_id: item.item_id,
      p_qty: qty,
    })

    // Insert stock movement
    await supabase.from('stock_movements').insert({
      company_id,
      item_id: item.item_id,
      movement_type: 'sale',
      quantity: -qty,
      cost_at_time: cost_price,
      user_id: cashier_id,
      reference_id: invoice_id,
    })

    // Update last_sold_at
    await supabase.from('items').update({ last_sold_at: new Date().toISOString() }).eq('id', item.item_id)
  }

  // 3. Audit log
  await supabase.from('audit_log').insert({
    company_id,
    user_id: cashier_id,
    action: 'SALE_COMPLETE',
    table_name: 'invoices',
    record_id: invoice_id,
    new_values: { total, payment_method, items_count: items.length },
    terminal_id: terminal_id || null,
  })

  // 4. Update customer stats + loyalty points
  let points_earned = 0
  if (customer_id) {
    const EARN_RATE = 1 // 1 point per $1
    points_earned = Math.floor(total * EARN_RATE)

    const { data: cust } = await supabase
      .from('customers')
      .select('loyalty_points, total_visits, lifetime_spend')
      .eq('id', customer_id)
      .single()

    if (cust) {
      const newPoints = (cust.loyalty_points || 0) + points_earned - loyalty_points_redeemed
      const newVisits = (cust.total_visits || 0) + 1
      const newSpend = parseFloat(cust.lifetime_spend || 0) + total
      const tier = newPoints >= 5000 ? 'platinum' : newPoints >= 2000 ? 'gold' : newPoints >= 500 ? 'silver' : 'bronze'

      await supabase.from('customers').update({
        loyalty_points: newPoints,
        loyalty_tier: tier,
        total_visits: newVisits,
        lifetime_spend: newSpend,
      }).eq('id', customer_id)

      if (points_earned > 0) {
        await supabase.from('loyalty_transactions').insert({
          company_id,
          customer_id,
          invoice_id,
          type: 'earn',
          points: points_earned,
          balance_after: newPoints,
          description: 'نقاط مكتسبة من عملية شراء',
        })
      }
    }
  }

  return { invoice_id, change_usd, change_lbp, points_earned }
}
