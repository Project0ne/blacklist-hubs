'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ReportFormDialogProps {
  onSuccess?: () => void
}

export function ReportFormDialog({ onSuccess }: ReportFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [hasCargoLoss, setHasCargoLoss] = useState(true)
  const [risk, setRisk] = useState<'高' | '中' | '低'>('高')
  const [platform, setPlatform] = useState('')
  const [customPlatform, setCustomPlatform] = useState('')
  const [disputeType, setDisputeType] = useState('')

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
        const fileName = `evidence/${Date.now()}_${file.name}`
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

    const payload = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      zip_code: formData.get('zip_code') as string || null,
      platform: platformValue || null,
      platform_id: formData.get('platform_id') as string || null,
      risk,
      dispute_type: disputeType,
      description: formData.get('description') as string,
      reporter_email: formData.get('reporter_email') as string || null,
      order_amount: parseFloat(formData.get('order_amount') as string) || null,
      refund_amount: parseFloat(formData.get('refund_amount') as string) || null,
      partial_refund_amount: parseFloat(formData.get('partial_refund_amount') as string) || null,
      has_cargo_loss: hasCargoLoss,
      cargo_loss_amount: hasCargoLoss ? (parseFloat(formData.get('cargo_loss_amount') as string) || null) : null,
      loss_bearer: hasCargoLoss ? (formData.get('loss_bearer') as string || null) : null,
      evidence_images: uploadedImages.length > 0 ? uploadedImages : null,
      status: 'pending',
      report_count: 1,
      related_emails: [formData.get('email') as string],
      related_phones: formData.get('phone') ? [formData.get('phone') as string] : [],
      related_addresses: formData.get('address') ? [formData.get('address') as string] : [],
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
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition"
      >
        ＋ 提交举报
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">📋 提交黑名单举报</h2>
          <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded border border-gray-700 hover:border-red-500 transition">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm text-yellow-400">
            ⏳ 举报提交后将进入人工审核队列，审核通过后公开显示，通常在 24 小时内处理。
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">买家姓名 *</label>
              <input name="name" required placeholder="买家真实姓名或常用名" className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:border-red-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">平台（选填）</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none">
                <option value="">选择平台</option>
                <option value="Amazon">Amazon</option>
                <option value="eBay">eBay</option>
                <option value="Shopify">Shopify</option>
                <option value="AliExpress">AliExpress</option>
                <option value="Wish">Wish</option>
                <option value="Etsy">Etsy</option>
                <option value="Walmart">Walmart</option>
                <option value="custom">自定义...</option>
              </select>
              {platform === 'custom' && (
                <input placeholder="输入平台名称" value={customPlatform} onChange={(e) => setCustomPlatform(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:border-red-500 mt-2" />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">平台 ID（选填）</label>
              <input name="platform_id" placeholder="买家在平台上的账号 ID" className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:border-red-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">邮箱地址 *</label>
              <input name="email" type="email" required placeholder="buyer@example.com" className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:border-red-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">电话号码 *</label>
              <input name="phone" required placeholder="+1 555 000 0000" className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:border-red-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">风险等级 *</label>
              <div className="flex gap-2">
                {(['低', '中', '高'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRisk(r)}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                      risk === r
                        ? r === '高' ? 'bg-red-600' : r === '中' ? 'bg-yellow-600' : 'bg-green-600'
                        : 'bg-gray-800 border border-gray-700'
                    }`}
                  >
                    {r === '高' ? '🔴' : r === '中' ? '🔶' : '⚠️'} {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm text-gray-400">收货地址 *</label>
              <input name="address" required placeholder="街道, 城市, 州/省, 邮编, 国家" className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:border-red-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">邮编（选填）</label>
              <input name="zip_code" placeholder="邮政编码" className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:border-red-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">纠纷类型 *</label>
              <select value={disputeType} onChange={(e) => setDisputeType(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none">
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
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <h3 className="text-sm font-medium text-red-400 mb-4">💰 金额信息（选填）</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">总订单金额</label>
                <input name="order_amount" type="number" step="0.01" placeholder="$ 0.00" className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:border-red-500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">退款/拒付金额</label>
                <input name="refund_amount" type="number" step="0.01" placeholder="$ 0.00" className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:border-red-500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">威胁拒付金额</label>
                <input name="partial_refund_amount" type="number" step="0.01" placeholder="$ 0.00" className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:border-red-500" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <h3 className="text-sm font-medium text-red-400 mb-4">📦 货物损失信息</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">是否有货物损失？ *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHasCargoLoss(false)}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition ${!hasCargoLoss ? 'bg-green-600' : 'bg-gray-800 border border-gray-700'}`}
                  >
                    ✅ 否
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasCargoLoss(true)}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition ${hasCargoLoss ? 'bg-red-600' : 'bg-gray-800 border border-gray-700'}`}
                  >
                    ❌ 是
                  </button>
                </div>
              </div>

              {hasCargoLoss && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">货物损失金额（选填）</label>
                      <input name="cargo_loss_amount" type="number" step="0.01" placeholder="$ 0.00" className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:border-red-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">损失承担方（选填）</label>
                      <select name="loss_bearer" className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none">
                        <option value="">请选择</option>
                        <option value="自己承担">自己承担</option>
                        <option value="平台承担">平台承担</option>
                        <option value="部分承担">部分承担</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">损失截图（选填，最多5张）</label>
                    <div
                      className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-gray-600 transition"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      <div className="text-2xl mb-2">📷</div>
                      <div className="text-sm text-gray-400">点击上传图片</div>
                      <div className="text-xs text-gray-500 mt-1">支持 JPG、PNG 格式，单张最大 5MB</div>
                    </div>
                    <input id="image-upload" type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                    {uploadedImages.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {uploadedImages.map((url, i) => (
                          <div key={i} className="relative w-20 h-20 rounded overflow-hidden">
                            <img src={url} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-xs">×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">详细说明 *</label>
              <textarea name="description" required placeholder="请描述具体情况：订单号、金额、发生时间、平台处理结果等..." className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:border-red-500 min-h-[100px]" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">举报人联系方式（选填，不公开）</label>
              <input name="reporter_email" placeholder="您的邮箱，审核结果将通知您" className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:border-red-500" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 border border-gray-700 rounded-md text-sm hover:border-gray-500 transition">
              取消
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium transition disabled:opacity-50">
              {loading ? '提交中...' : '提交举报'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
