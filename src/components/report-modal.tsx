'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const sb = createClient(supabaseUrl, supabaseKey)

interface ReportModalProps {
  open: boolean
  onClose: () => void
  demoMode: boolean
  onSuccess: () => void
  showToast: (msg: string, type: 'success' | 'error') => void
}

export function ReportModal({ open, onClose, demoMode, onSuccess, showToast }: ReportModalProps) {
  const [selectedRisk, setSelectedRisk] = useState('高')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    platform: '',
    platform_id: '',
    address: '',
    type: '仅退款',
    desc: '',
    reporter: '',
  })

  const updateForm = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      platform: '',
      platform_id: '',
      address: '',
      type: '仅退款',
      desc: '',
      reporter: '',
    })
    setSelectedRisk('高')
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { showToast('请填写买家姓名', 'error'); return }
    if (!form.email.trim()) { showToast('请填写邮箱地址', 'error'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { showToast('邮箱格式不正确', 'error'); return }
    if (!form.desc.trim()) { showToast('请填写详细说明', 'error'); return }

    setLoading(true)

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      platform: form.platform || null,
      platform_id: form.platform_id || null,
      address: form.address || null,
      risk: selectedRisk,
      dispute_type: form.type,
      description: form.desc,
      reporter_email: form.reporter || null,
      status: 'pending',
      report_count: 1,
      related_emails: [form.email],
      related_phones: form.phone ? [form.phone] : [],
      related_addresses: form.address ? [form.address] : [],
    }

    if (demoMode) {
      setTimeout(() => {
        setLoading(false)
        onClose()
        showToast('举报已提交，等待管理员审核（演示模式）', 'success')
        resetForm()
      }, 800)
      return
    }

    const { error } = await sb.from('blacklist').insert(payload)
    setLoading(false)

    if (error) {
      showToast('提交失败：' + error.message, 'error')
      return
    }

    onClose()
    showToast('举报已提交，等待管理员审核，感谢您的贡献！', 'success')
    resetForm()
    onSuccess()
  }

  if (!open) return null

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">📋 提交黑名单举报</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="pending-notice">
            ⏳ 举报提交后将进入<strong style={{ margin: '0 4px' }}>人工审核</strong>队列，审核通过后公开显示，通常在 24 小时内处理。
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>买家姓名 <span className="req">*</span></label>
              <input className="form-input" placeholder="买家真实姓名或常用名" value={form.name} onChange={e => updateForm('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label>平台 <span className="opt">（选填）</span></label>
              <select className="form-select" value={form.platform} onChange={e => updateForm('platform', e.target.value)}>
                <option value="">选择平台</option>
                <option>Amazon</option><option>eBay</option><option>Shopify</option>
                <option>AliExpress</option><option>Wish</option><option>Etsy</option>
                <option>Walmart</option><option>其他</option>
              </select>
            </div>
            <div className="form-group">
              <label>平台 ID <span className="opt">（选填）</span></label>
              <input className="form-input" placeholder="买家在平台上的账号 ID" value={form.platform_id} onChange={e => updateForm('platform_id', e.target.value)} />
            </div>
            <div className="form-group">
              <label>邮箱地址 <span className="req">*</span></label>
              <input className="form-input" type="email" placeholder="buyer@example.com" value={form.email} onChange={e => updateForm('email', e.target.value)} />
              <div className="form-hint">作为买家身份关联的主键</div>
            </div>
            <div className="form-group">
              <label>电话号码 <span className="opt">（选填）</span></label>
              <input className="form-input" placeholder="+1 555 000 0000" value={form.phone} onChange={e => updateForm('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label>风险等级 <span className="req">*</span></label>
              <div className="risk-selector">
                <div className={`risk-option r-low ${selectedRisk === '低' ? 'selected' : ''}`} onClick={() => setSelectedRisk('低')}>⚠️ 低</div>
                <div className={`risk-option r-mid ${selectedRisk === '中' ? 'selected' : ''}`} onClick={() => setSelectedRisk('中')}>🔶 中</div>
                <div className={`risk-option r-high ${selectedRisk === '高' ? 'selected' : ''}`} onClick={() => setSelectedRisk('高')}>🔴 高</div>
              </div>
            </div>
            <div className="form-group full">
              <label>收货地址 <span className="opt">（选填）</span></label>
              <input className="form-input" placeholder="街道, 城市, 州/省, 邮编, 国家" value={form.address} onChange={e => updateForm('address', e.target.value)} />
            </div>
            <div className="form-group full">
              <label>纠纷类型 <span className="req">*</span></label>
              <select className="form-select" value={form.type} onChange={e => updateForm('type', e.target.value)}>
                <option value="仅退款">仅退款（不退货）</option>
                <option value="虚假未收到">虚假声称未收到</option>
                <option value="恶意差评">恶意差评勒索</option>
                <option value="虚假纠纷">虚假纠纷/争议</option>
                <option value="信用卡拒付">信用卡拒付欺诈</option>
                <option value="空包">空包/重量纠纷</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div className="form-group full">
              <label>详细说明 <span className="req">*</span></label>
              <textarea className="form-textarea" placeholder="请描述具体情况：订单号、金额、发生时间、平台处理结果等..." value={form.desc} onChange={e => updateForm('desc', e.target.value)} />
            </div>
            <div className="form-group full">
              <label>举报人联系方式 <span className="opt">（选填，不公开）</span></label>
              <input className="form-input" placeholder="您的邮箱，审核结果将通知您" value={form.reporter} onChange={e => updateForm('reporter', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>取消</button>
          <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? '提交中...' : '提交举报'}
          </button>
        </div>
      </div>
    </div>
  )
}
