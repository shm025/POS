export function exportItemsCSV(items) {
  const rows = [
    ['Code','Name','Category','Cost','Price','Stock'],
    ...items.map(i => [i.code, i.name, i.category, i.cost, i.price, i.stock])
  ]
  downloadCSV(rows, 'items.csv')
}

export function exportStockCSV(items) {
  const rows = [
    ['Code','Item','Stock','Value'],
    ...items.map(i => [i.code, i.name, i.stock, (i.stock * i.cost).toFixed(2)])
  ]
  downloadCSV(rows, 'stock.csv')
}

function downloadCSV(rows, filename) {
  const a = document.createElement('a')
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\ufeff' + rows.map(r => r.join(',')).join('\n'))
  a.download = filename
  a.click()
}
