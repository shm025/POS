import { numberToArabicWords, fmt } from './format'

export function printVoucherWindow(voucher, company, voucherType) {
  const debit  = voucher.method?.split(' | ')[0] || voucher.party || '—'
  const credit = voucher.method?.split(' | ')[1] || '—'
  const isReceipt = voucherType === 'receipt'

  const titleAr = isReceipt ? 'سند قبض' : 'سند دفع'
  const titleEn = isReceipt ? 'Receipt Voucher' : 'Payment Voucher'
  const partyLabel   = isReceipt ? 'Received From / استلمنا من' : 'Paid To / دفعنا إلى'
  const accountLabel = isReceipt ? 'Credit Account / الحساب الدائن' : 'Debit Account / الحساب المدين'
  const sig1 = isReceipt ? 'Received By / المستلم' : 'Paid By / الدافع'

  const amountWords = numberToArabicWords(voucher.amount)
  const amountFmt   = fmt(voucher.amount)
  const currency    = company?.currency || 'USD'

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <title>${titleAr} — ${voucher.number}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      background: #fff;
      color: #000;
      font-size: 12px;
      padding: 24px 32px;
      direction: rtl;
    }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #999; padding: 5px 10px; font-size: 11px; }
    .no-border td { border: none; }
    .company-name { font-size: 16px; font-weight: 900; margin-bottom: 2px; }
    .company-sub  { font-size: 11px; color: #444; margin-bottom: 2px; }
    .doc-title-bar {
      text-align: center;
      background: #222;
      color: #fff;
      padding: 8px 14px;
      border-radius: 3px;
      margin-bottom: 12px;
    }
    .doc-title-bar .ar { font-size: 15px; font-weight: 900; }
    .doc-title-bar .en { font-size: 11px; opacity: 0.85; margin-top: 2px; }
    .meta-label { color: #555; width: 35%; }
    .meta-value { font-weight: 700; }
    .party-row td { padding: 8px 10px; }
    .party-name { font-size: 14px; font-weight: 700; }
    .section-head { background: #f0f0f0; font-weight: 700; }
    .amount-box {
      text-align: center;
      padding: 12px;
      border-right: 1px solid #999;
    }
    .amount-num { font-size: 26px; font-weight: 900; direction: ltr; }
    .amount-label { font-size: 10px; color: #555; margin-bottom: 4px; }
    .words-box { padding: 10px 12px; }
    .words-label { font-size: 10px; color: #555; margin-bottom: 4px; }
    .words-text { font-size: 13px; font-weight: 600; }
    .sig-table td { border: 1px solid #bbb; text-align: center; padding: 28px 10px 8px; font-size: 11px; color: #555; }
    .sig-line { border-top: 1px solid #999; margin-bottom: 4px; margin-top: 16px; }
    .footer-note { text-align: center; font-size: 10px; color: #aaa; margin-top: 10px; }
    @media print {
      body { padding: 16px 24px; }
    }
  </style>
</head>
<body>

  <!-- Company block -->
  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
    <div>
      <div class="company-name">${company?.name || 'Company'}</div>
      ${company?.name_en ? `<div class="company-sub">${company.name_en}</div>` : ''}
      ${company?.address ? `<div class="company-sub">${company.address}</div>` : ''}
      ${company?.phone   ? `<div class="company-sub" style="direction:ltr">${company.phone}</div>` : ''}
    </div>
    <div style="text-align:center; min-width:220px;">
      <div class="doc-title-bar">
        <div class="ar">${titleAr}</div>
        <div class="en">${titleEn}</div>
      </div>
      <table class="no-border" style="width:220px; margin-right:auto;">
        <tr>
          <td class="meta-label" style="border:none; padding:3px 6px;">رقم السند</td>
          <td class="meta-value" style="border:none; padding:3px 6px; direction:ltr; color:#1a56db">${voucher.number}</td>
        </tr>
        <tr>
          <td class="meta-label" style="border:none; padding:3px 6px;">التاريخ</td>
          <td class="meta-value" style="border:none; padding:3px 6px;">${voucher.date}</td>
        </tr>
        <tr>
          <td class="meta-label" style="border:none; padding:3px 6px;">العملة</td>
          <td class="meta-value" style="border:none; padding:3px 6px;">${currency}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Party & description -->
  <table style="margin-bottom:0;">
    <tr>
      <td class="section-head" style="width:30%">${partyLabel}</td>
      <td class="party-name">${debit}</td>
    </tr>
    <tr>
      <td class="section-head">${accountLabel}</td>
      <td>${credit}</td>
    </tr>
    <tr>
      <td class="section-head">البيان / Description</td>
      <td>${voucher.description || '—'}</td>
    </tr>
  </table>

  <!-- Amount -->
  <table style="margin-top:0; border-top:none;">
    <tr>
      <td class="words-box" style="width:60%; border-right:1px solid #999;">
        <div class="words-label">المبلغ كتابةً / Amount in Words</div>
        <div class="words-text">${amountWords} ${currency === 'USD' ? 'دولار أمريكي' : currency} لا غير</div>
      </td>
      <td class="amount-box" style="width:40%; background:#fafafa;">
        <div class="amount-label">المبلغ / Amount</div>
        <div class="amount-num">${currency === 'USD' ? '$' : ''}${amountFmt}</div>
      </td>
    </tr>
  </table>

  <!-- Signatures -->
  <table class="sig-table" style="margin-top:8px;">
    <tr>
      <td><div class="sig-line"></div>Cashier / المحاسب</td>
      <td><div class="sig-line"></div>${sig1}</td>
      <td><div class="sig-line"></div>Approved / المدير</td>
    </tr>
  </table>

  <div class="footer-note">Printed: ${new Date().toLocaleString()}</div>

  <script>
    window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }
  </script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=720,height=600')
  win.document.write(html)
  win.document.close()
}
