'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { BlacklistItem } from '@/types'

interface ReportFormDialogProps {
  onSuccess?: () => void
  externalOpen?: boolean
  onOpenChange?: (open: boolean) => void
  supplementItem?: BlacklistItem | null
}

export function ReportFormDialog({ onSuccess, externalOpen, onOpenChange, supplementItem }: ReportFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen ?? internalOpen
  const setOpen = (value: boolean) => {
    setInternalOpen(value)
    onOpenChange?.(value)
  }
  const [loading, setLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [risk, setRisk] = useState<'高' | '中' | '低'>('高')
  const [platform, setPlatform] = useState('')
  const [customPlatform, setCustomPlatform] = useState('')
  const [disputeType, setDisputeType] = useState('')
  const [customDisputeType, setCustomDisputeType] = useState('')

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (uploadedImages.length + files.length > 5) {
      alert('最多只能上传5张图片')
      return
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`图片 ${file.name} 超过5MB限制`)
        continue
      }

      try {
        // 安全处理文件名：移除中文字符和特殊字符，只保留字母数字和点
        const ext = file.name.split('.').pop() || 'jpg'
        const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const fileName = `evidence/${safeName}`
        const { error } = await supabase.storage.from('evidence-images').upload(fileName, file)
        if (error) throw error

        const { data: urlData } = supabase.storage.from('evidence-images').getPublicUrl(fileName)
        setUploadedImages(prev => [...prev, urlData.publicUrl])
      } catch (err: any) {
        alert('图片上传失败：' + err.message)
      }
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const platformValue = platform === 'custom' ? customPlatform : platform
    const disputeTypeValue = disputeType === '其他' ? customDisputeType : disputeType

    const payload: Record<string, any> = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      zip_code: formData.get('zip_code') as string || null,
      platform: platformValue || null,
      platform_id: formData.get('platform_id') as string || null,
      risk,
      dispute_type: disputeTypeValue,
      description: formData.get('description') as string,
      reporter_email: formData.get('reporter_email') as string || null,
      refund_amount: parseFloat(formData.get('refund_amount') as string) || null,
      evidence_images: uploadedImages.length > 0 ? uploadedImages : null,
      status: 'pending',
      report_count: 1,
      related_emails: [formData.get('email') as string],
      related_phones: formData.get('phone') ? [formData.get('phone') as string] : [],
      related_addresses: formData.get('address') ? [formData.get('address') as string] : [],
    }

    // 补充举报时关联同一个 buyer_group_id
    if (supplementItem?.buyer_group_id) {
      payload.buyer_group_id = supplementItem.buyer_group_id
    } else {
      // 新举报时自动查找相同邮箱的已有记录，关联 buyer_group_id
      try {
        const { data: existing } = await supabase
          .from('blacklist')
          .select('buyer_group_id')
          .eq('email', formData.get('email') as string)
          .not('buyer_group_id', 'is', null)
          .limit(1)
        if (existing && existing.length > 0 && existing[0].buyer_group_id) {
          payload.buyer_group_id = existing[0].buyer_group_id
        }
      } catch {} // 查询失败不影响提交
    }

    try {
      const { error } = await supabase.from('blacklist').insert(payload)
      if (error) throw error

      alert('举报已提交，等待管理员审核！')
      setOpen(false)
      onSuccess?.()
    } catch (err: any) {
      alert('提交失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center gap-2 transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        提交举报
      </button>
    )
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/75 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center p-4 py-8">
        <div className="bg-[#161822] border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="border-b border-gray-800 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">提交黑名单举报</h2>
              <p className="text-xs text-gray-500">黑名单条目</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white transition">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 警告提示 */}
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-sm text-yellow-400">
              ⏳ 举报提交后将进入 <strong>人工审核</strong> 队列，审核通过后公开显示，通常在 24 小时内处理。
            </p>
          </div>

          {/* 基本信息 */}
          <section className="space-y-4">
            {/* 第1行：买家姓名 + 平台 */}
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="买家姓名" name="name" placeholder="买家真实姓名或常用昵称" required defaultValue={supplementItem?.name} />
              <div>
                <label className="block text-sm text-gray-400 mb-2">平台 <span className="text-gray-600">（选填）</span></label>
                <select 
                  value={platform} 
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1d27] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-red-500/50"
                >
                  <option value="">选择平台</option>
                  <option value="Amazon">Amazon</option>
                  <option value="eBay">eBay</option>
                  <option value="Shopify">Shopify</option>
                  <option value="AliExpress">AliExpress</option>
                  <option value="Wish">Wish</option>
                  <option value="Alibaba">Alibaba</option>
                  <option value="Etsy">Etsy</option>
                  <option value="Walmart">Walmart</option>
                  <option value="Shopee">Shopee</option>
                  <option value="TikTok Shop">TikTok Shop</option>
                  <option value="TEMU">TEMU</option>
                  <option value="SHEIN">SHEIN</option>
                  <option value="Alibaba">Alibaba</option>
                  <option value="SHOPLAZZA">SHOPLAZZA</option>
                  <option value="OZON">OZON</option>
                  <option value="custom">自定义...</option>
                </select>
                {platform === 'custom' && (
                  <input 
                    placeholder="输入平台名称" 
                    value={customPlatform} 
                    onChange={(e) => setCustomPlatform(e.target.value)} 
                    className="w-full mt-2 px-4 py-3 bg-[#1a1d27] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-red-500/50" 
                  />
                )}
              </div>
            </div>

            {/* 第2行：平台 ID + 邮箱地址 */}
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="平台 ID" name="platform_id" placeholder="买家在平台上的账号 ID" labelSuffix="（选填）" defaultValue={supplementItem?.platform_id} />
              <div>
                <label className="block text-sm text-gray-400 mb-2">邮箱地址 <span className="text-red-400">*</span></label>
                <input 
                  name="email" 
                  type="email" 
                  placeholder="buyer@example.com" 
                  required
                  defaultValue={supplementItem?.email}
                  className="w-full px-4 py-3 bg-[#1a1d27] border border-gray-700 rounded-lg text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-red-500/50 transition"
                />
                <p className="text-xs text-gray-500 mt-1">作为买家身份关联的主键</p>
              </div>
            </div>

            {/* 第3行：电话号码 + 风险等级 */}
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="电话号码" name="phone" placeholder="+1 555 000 0000" required defaultValue={supplementItem?.phone} />
              <div>
                <label className="block text-sm text-gray-400 mb-2">风险等级 <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  {(['低', '中', '高'] as const).map((r) => {
                    const isSelected = risk === r
                    const config = {
                      '低': { icon: '▲', color: 'yellow', selectedBg: 'bg-yellow-500/20', selectedBorder: 'border-yellow-500', selectedText: 'text-yellow-400' },
                      '中': { icon: '◆', color: 'orange', selectedBg: 'bg-orange-500/20', selectedBorder: 'border-orange-500', selectedText: 'text-orange-400' },
                      '高': { icon: '●', color: 'red', selectedBg: 'bg-red-500/20', selectedBorder: 'border-red-500', selectedText: 'text-red-400' },
                    }[r]
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRisk(r)}
                        className={`
                          flex-1 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-1.5 text-sm
                          ${isSelected
                            ? `${config.selectedBg} border ${config.selectedBorder} ${config.selectedText}`
                            : 'bg-[#1a1d27] border border-gray-700 text-gray-400 hover:border-gray-600'
                          }
                        `}
                      >
                        <span>{config.icon}</span> {r}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 第4行：收货地址 */}
            <FormInput label="收货地址" name="address" placeholder="街道, 城市, 州/省, 邮编, 国家" required defaultValue={supplementItem?.address} />

            {/* 第5行：纠纷类型（全宽） */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">纠纷类型 <span className="text-red-400">*</span></label>
              <select 
                value={disputeType} 
                onChange={(e) => { setDisputeType(e.target.value); if (e.target.value !== '其他') setCustomDisputeType(''); }} 
                required
                className="w-full px-4 py-3 bg-[#1a1d27] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-red-500/50"
              >
                <option value="">请选择纠纷类型</option>
                <option value="仅退款（不退货）">仅退款（不退货）</option>
                <option value="虚假声称未收到">虚假声称未收到</option>
                <option value="恶意差评勒索">恶意差评勒索</option>
                <option value="虚假纠纷/争议">虚假纠纷/争议</option>
                <option value="信用卡拒付欺诈">信用卡拒付欺诈</option>
                <option value="空包/重量纠纷">空包/重量纠纷</option>
                <option value="TRO律师事务所">TRO律师事务所</option>
                <option value="品牌方钓鱼执法">品牌方钓鱼执法</option>
                <option value="恶意投诉侵权">恶意投诉侵权</option>
                <option value="虚假退货退款">虚假退货退款</option>
                <option value="恶意索赔">恶意索赔</option>
                <option value="其他">其他</option>
              </select>
              {disputeType === '其他' && (
                <input 
                  placeholder="请输入纠纷类型" 
                  value={customDisputeType} 
                  onChange={(e) => setCustomDisputeType(e.target.value)} 
                  required
                  className="w-full mt-2 px-4 py-3 bg-[#1a1d27] border border-gray-700 rounded-lg text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-red-500/50" 
                />
              )}
            </div>
          </section>

          {/* 金额信息 */}
          <section>
            <h3 className="text-sm font-medium text-gray-300 mb-4">💰 白嫖金额（选填）</h3>
            <FormInput label="退款/拒付金额" name="refund_amount" type="number" step="0.01" placeholder="$ 0.00" />
          </section>

          {/* 证据图片 */}
          <section>
            <h3 className="text-sm font-medium text-gray-300 mb-4">📷 损失截图（选填，最多5张，tinypng 压缩后上传）</h3>
            <div
              className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-gray-600 transition"
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              <div className="text-3xl mb-2">📷</div>
              <div className="text-gray-400">点击上传图片</div>
              <div className="text-xs text-gray-500 mt-1">支持 JPG、PNG 格式，单张最大 5MB</div>
            </div>
            <input id="image-upload" type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
            {uploadedImages.length > 0 && (
              <div className="flex gap-3 flex-wrap mt-4">
                {uploadedImages.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-700 group">
                    <img src={url} className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => removeImage(i)} 
                      className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 详细说明 */}
          <section>
            <h3 className="text-sm font-medium text-gray-300 mb-4">详细说明 <span className="text-red-400">*</span></h3>
            <textarea 
              name="description" 
              required 
              placeholder="请描述具体情况：订单号、金额、发生时间、平台处理结果等..."
              className="w-full px-4 py-3 bg-[#1a1d27] border border-gray-700 rounded-lg text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-red-500/50 min-h-[120px] resize-none"
            />
          </section>

          {/* 举报人信息 */}
          <section>
            <FormInput label="举报人联系方式（选填，不公开）" name="reporter_email" placeholder="您的邮箱，审核结果将通知您" />
          </section>

          {/* 提交按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button 
              type="button" 
              onClick={() => setOpen(false)} 
              className="px-6 py-3 border border-gray-700 rounded-lg text-gray-300 hover:border-gray-600 transition"
            >
              取消
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading ? '提交中...' : '提交举报'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}

function FormInput({ label, name, type = 'text', placeholder, required, step, labelSuffix, defaultValue }: { 
  label: string; name: string; type?: string; placeholder?: string; required?: boolean; step?: string; labelSuffix?: string; defaultValue?: string | number | null 
}) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
        {labelSuffix && <span className="text-gray-600"> {labelSuffix}</span>}
      </label>
      <input 
        name={name} 
        type={type} 
        step={step}
        placeholder={placeholder} 
        required={required}
        defaultValue={defaultValue ?? undefined}
        className="w-full px-4 py-3 bg-[#1a1d27] border border-gray-700 rounded-lg text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-red-500/50 transition"
      />
    </div>
  )
}
