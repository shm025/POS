const DB_NAME = 'NABCOdb2'
const DB_VER = 2
let db

export function initDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VER)
    req.onupgradeneeded = e => {
      const d = e.target.result
      const stores = ['items','accounts','invoices','salesReturns','orders','purchases','purchReturns','journalEntries','vouchers','warehouses','settings']
      stores.forEach(s => { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id', autoIncrement: true }) })
    }
    req.onsuccess = e => { db = e.target.result; res(db) }
    req.onerror = rej
  })
}

export function dbGet(store, id) {
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readonly')
    tx.objectStore(store).get(id).onsuccess = e => res(e.target.result)
    tx.onerror = rej
  })
}

export function dbGetAll(store) {
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readonly')
    tx.objectStore(store).getAll().onsuccess = e => res(e.target.result)
    tx.onerror = rej
  })
}

export function dbPut(store, data) {
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).put(data).onsuccess = e => res(e.target.result)
    tx.onerror = rej
  })
}

export function dbDelete(store, id) {
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).delete(id).onsuccess = () => res()
    tx.onerror = rej
  })
}

export async function seedData() {
  const items = await dbGetAll('items')
  if (!items.length) {
    const seed = [
      { code:'ITM-001',name:'لاب توب Dell XPS 15',category:'إلكترونيات',unit:'قطعة',cost:1200,price:1500,stock:25,minStock:5,desc:'لاب توب احترافي' },
      { code:'ITM-002',name:'طابعة HP LaserJet',category:'إلكترونيات',unit:'قطعة',cost:280,price:350,stock:12,minStock:3,desc:'طابعة ليزر' },
      { code:'ITM-003',name:'ورق A4 (ريمة)',category:'قرطاسية',unit:'ريمة',cost:4,price:6,stock:200,minStock:50,desc:'ورق طباعة' },
      { code:'ITM-004',name:'أحبار طابعة HP',category:'قرطاسية',unit:'قطعة',cost:15,price:25,stock:4,minStock:10,desc:'خراطيش حبر' },
      { code:'ITM-005',name:'شاشة Samsung 24"',category:'إلكترونيات',unit:'قطعة',cost:180,price:230,stock:8,minStock:3,desc:'شاشة IPS FHD' },
      { code:'ITM-006',name:'كرسي مكتبي',category:'أثاث',unit:'قطعة',cost:90,price:140,stock:15,minStock:5,desc:'كرسي مريح' },
      { code:'ITM-007',name:'ماوس لوجيتك',category:'إلكترونيات',unit:'قطعة',cost:20,price:35,stock:30,minStock:10,desc:'ماوس لاسلكي' },
      { code:'ITM-008',name:'USB Flash 32GB',category:'إلكترونيات',unit:'قطعة',cost:8,price:14,stock:2,minStock:15,desc:'ذاكرة USB' },
    ]
    for (const it of seed) await dbPut('items', it)
  }

  const accounts = await dbGetAll('accounts')
  if (!accounts.length) {
    const accs = [
      { code:'1001',name:'الصندوق',type:'asset',debit:45000,credit:0 },
      { code:'1002',name:'البنك',type:'asset',debit:120000,credit:0 },
      { code:'1100',name:'المدينون',type:'asset',debit:35000,credit:0 },
      { code:'1200',name:'المخزون',type:'asset',debit:80000,credit:0 },
      { code:'2001',name:'الدائنون',type:'liability',debit:0,credit:28000 },
      { code:'2100',name:'قروض قصيرة الأجل',type:'liability',debit:0,credit:15000 },
      { code:'3001',name:'رأس المال',type:'equity',debit:0,credit:200000 },
      { code:'4001',name:'إيرادات المبيعات',type:'revenue',debit:0,credit:95000 },
      { code:'5001',name:'تكلفة البضاعة المباعة',type:'expense',debit:62000,credit:0 },
      { code:'5100',name:'مصاريف إدارية',type:'expense',debit:8500,credit:0 },
      { code:'5200',name:'مصاريف التسويق',type:'expense',debit:3200,credit:0 },
    ]
    for (const a of accs) await dbPut('accounts', a)
  }

  const invoices = await dbGetAll('invoices')
  if (!invoices.length) {
    const customers = ['شركة الأمل التجارية','مؤسسة النجاح','شركة الخليج','محلات السعادة','مجموعة الفجر']
    for (let i = 1; i <= 8; i++) {
      const sub = i * 850 + 200
      await dbPut('invoices', {
        number:`INV-2026-00${i}`, party:customers[i%customers.length],
        date:`2026-0${Math.ceil(i/2)}-${String(i*3).padStart(2,'0')}`,
        dueDate:'2026-05-30', warehouse:'المخزن الرئيسي',
        subtotal:sub, discount:5, tax:11, total:+(sub*0.95*1.11).toFixed(2),
        status: i%3===0?'unpaid':'paid', notes:'', items:[],
      })
    }
  }

  const warehouses = await dbGetAll('warehouses')
  if (!warehouses.length) {
    await dbPut('warehouses', { name:'المخزن الرئيسي',location:'بيروت - الأشرفية',manager:'وجيه' })
    await dbPut('warehouses', { name:'مخزن فرعي',location:'بيروت - الحمرا',manager:'أحمد' })
  }
}
