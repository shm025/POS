export function fmt(n, dec = 2) {
  const num = parseFloat(n || 0)
  return num.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

export function fmtInt(n) {
  return parseInt(n || 0).toLocaleString('en-US')
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
