import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { supabase } from '../lib/supabase'
import { notify } from '../utils/notify'
import { formatCurrency } from '../utils/format'

export default function CompanySettingsPage() {
  const { company, refreshCompany } = useAuth()
  const { t } = useLang()
  const [form, setForm] = useState({
    name: '',
    name_en: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    currency: 'USD - دولار أمريكي',
    tax_rate: 11,
    period_start: '2026-01-01',
    period_end: '2026-12-31',
    reg_number: '',
    exchange_rate: 89500,
    timezone: 'Asia/Beirut',
    plan: 'starter',
  })

  useEffect(() => {
    if (company) {
      setForm(f => ({
        ...f,
        name: company.name || '',
        name_en: company.name_en || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        tax_rate: company.tax_rate ?? 11,
        reg_number: company.reg_number || '',
        exchange_rate: company.exchange_rate || 89500,
        timezone: company.timezone || 'Asia/Beirut',
        plan: company.plan || 'starter',
      }))
    }
  }, [company])

  async function handleSave() {
    if (!company?.id) return
    const { error } = await supabase.from('companies').update({
      name: form.name,
      name_en: form.name_en,
      address: form.address,
      phone: form.phone,
      email: form.email,
      website: form.website,
      tax_rate: parseFloat(form.tax_rate) || 0,
      reg_number: form.reg_number,
      exchange_rate: parseFloat(form.exchange_rate) || 89500,
      exchange_rate_updated_at: new Date().toISOString(),
      timezone: form.timezone,
      plan: form.plan,
    }).eq('id', company.id)

    if (error) {
      notify(t('save_error'), 'error')
    } else {
      notify(t('company_saved'))
      refreshCompany()
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const preview = formatCurrency(100, form.exchange_rate)

  return (
    <div className="page-view">
      <div className="flex-between mb-4">
        <h1 style={{ fontSize:'20px', fontWeight:900, color:'var(--primary)' }}>🏢 {t('company_settings_title')}</h1>
        <button className="btn btn-primary" onClick={handleSave}>💾 {t('save_settings_btn')}</button>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">📝 {t('company_data_section')}</div></div>
          <div className="form-group">
            <label className="form-label">{t('lbl_company_name_ar')}</label>
            <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_company_name_en')}</label>
            <input className="form-control" value={form.name_en} onChange={e => set('name_en', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_address')}</label>
            <input className="form-control" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_phone_settings')}</label>
            <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_email')}</label>
            <input className="form-control" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_website')}</label>
            <input className="form-control" value={form.website} onChange={e => set('website', e.target.value)} />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">⚙️ {t('system_settings_section')}</div></div>
          <div className="form-group">
            <label className="form-label">{t('lbl_currency')}</label>
            <select className="form-control" value={form.currency} onChange={e => set('currency', e.target.value)}>
              <option>USD - دولار أمريكي</option>
              <option>LBP - ليرة لبنانية</option>
              <option>EUR - يورو</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">💱 سعر الصرف (1 USD = ? LBP)</label>
            <input
              type="number"
              className="form-control"
              value={form.exchange_rate}
              onChange={e => set('exchange_rate', e.target.value)}
              placeholder="89500"
            />
            <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'4px' }}>
              معاينة: {preview.usd} = {preview.lbp}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">المنطقة الزمنية</label>
            <select className="form-control" value={form.timezone} onChange={e => set('timezone', e.target.value)}>
              <option value="Asia/Beirut">Asia/Beirut (لبنان)</option>
              <option value="UTC">UTC</option>
              <option value="Europe/London">Europe/London</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_tax_rate')}</label>
            <input type="number" className="form-control" value={form.tax_rate} onChange={e => set('tax_rate', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_period_start')}</label>
            <input type="date" className="form-control" value={form.period_start} onChange={e => set('period_start', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_period_end')}</label>
            <input type="date" className="form-control" value={form.period_end} onChange={e => set('period_end', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('lbl_reg_number')}</label>
            <input className="form-control" value={form.reg_number} onChange={e => set('reg_number', e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  )
}
