export function fmt(n, dec = 2) {
  const num = parseFloat(n || 0)
  return num.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

export function fmtInt(n) {
  return parseInt(n || 0).toLocaleString('en-US')
}

// Dual-currency formatter — use EVERYWHERE a price is displayed
// Returns { usd: '$10.50', lbp: 'LL 939,750', usdRaw: 10.5, lbpRaw: 939750 }
export function formatCurrency(amount_usd, exchange_rate = 89500) {
  const usdVal = parseFloat(amount_usd || 0)
  const rate = parseFloat(exchange_rate || 89500)
  const lbpVal = Math.round(usdVal * rate)
  return {
    usd: '$' + usdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    lbp: 'LL ' + lbpVal.toLocaleString('en-US', { maximumFractionDigits: 0 }),
    usdRaw: usdVal,
    lbpRaw: lbpVal,
  }
}

// Format only LBP (no decimals, comma thousands)
export function fmtLBP(amount_lbp) {
  return 'LL ' + Math.round(parseFloat(amount_lbp || 0)).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// Format only USD
export function fmtUSD(amount_usd) {
  return '$' + parseFloat(amount_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function numberToArabicWords(number) {
  const n = Math.floor(parseFloat(number) || 0)
  const ones = ['','واحد','اثنان','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة','عشرة','أحد عشر','اثنا عشر','ثلاثة عشر','أربعة عشر','خمسة عشر','ستة عشر','سبعة عشر','ثمانية عشر','تسعة عشر']
  const tens = ['','','عشرون','ثلاثون','أربعون','خمسون','ستون','سبعون','ثمانون','تسعون']
  if (n === 0) return 'صفر'
  if (n < 20) return ones[n]
  if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' و' + ones[n%10] : '')
  if (n < 1000) return ones[Math.floor(n/100)] + ' مئة' + (n%100 ? ' و' + numberToArabicWords(n%100) : '')
  if (n < 1000000) return numberToArabicWords(Math.floor(n/1000)) + ' ألف' + (n%1000 ? ' و' + numberToArabicWords(n%1000) : '')
  return numberToArabicWords(Math.floor(n/1000000)) + ' مليون' + (n%1000000 ? ' و' + numberToArabicWords(n%1000000) : '')
}
