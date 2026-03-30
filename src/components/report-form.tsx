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
      alert('Maximum 5 images allowed')
      return
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Image ${file.name} exceeds 5MB limit`)
        continue
      }

      try {
        const fileName = `evidence/${Date.now()}_${file.name}`
        const { error } = await supabase.storage.from('evidence-images').upload(fileName, file)
        if (error) throw error

        const { data: urlData } = supabase.storage.from('evidence-images').getPublicUrl(fileName)
        setUploadedImages(prev => [...prev, urlData.publicUrl])
      } catch (err: any) {
        alert('Upload failed: ' + err.message)
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

      alert('Report submitted successfully! Pending review.')
      setOpen(false)
      onSuccess?.()
    } catch (err: any) {
      alert('Submission failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-industrial btn-industrial-danger flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        REPORT
      </button>
    )
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-3xl animate-slide-up">
        {/* 顶部警告条 */}
        <div className="h-1.5 bg-gradient-to-r from-hazard-500 via-danger-500 to-hazard-500" />
        
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-hazard-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-hazard-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-100">SUBMIT REPORT</h2>
              <p className="text-xs font-mono text-surface-500">BLACKLIST ENTRY</p>
            </div>
          </div>
          <button 
            onClick={() => setOpen(false)} 
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-800 border border-surface-700 text-surface-400 hover:bg-surface-700 hover:text-surface-200 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 警告提示 */}
          <div className="p-4 bg-hazard-500/10 border border-hazard-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-hazard-500/20 rounded flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-hazard-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-hazard-400 font-medium">PENDING REVIEW QUEUE</p>
                <p className="text-xs text-hazard-500/70 mt-1">Reports are reviewed within 24 hours before publication.</p>
              </div>
            </div>
          </div>

          {/* 基本信息 */}
          <section>
            <h3 className="text-xs font-mono font-medium text-surface-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-hazard-500 rounded-full" />
              BUYER INFORMATION
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Name *" name="name" placeholder="Buyer's real name" required />
              <FormSelect
                label="Platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                options={[
                  { value: '', label: 'Select Platform' },
                  { value: 'Amazon', label: 'Amazon' },
                  { value: 'eBay', label: 'eBay' },
                  { value: 'Shopify', label: 'Shopify' },
                  { value: 'AliExpress', label: 'AliExpress' },
                  { value: 'Wish', label: 'Wish' },
                  { value: 'Etsy', label: 'Etsy' },
                  { value: 'Walmart', label: 'Walmart' },
                  { value: 'custom', label: 'Custom...' },
                ]}
              />
              <FormInput label="Platform ID" name="platform_id" placeholder="Buyer's platform account ID" />
              <FormInput label="Email *" name="email" type="email" placeholder="buyer@example.com" required />
              <FormInput label="Phone *" name="phone" placeholder="+1 555 000 0000" required />
              <div className="col-span-2">
                <label className="block text-xs font-mono text-surface-500 mb-2">RISK LEVEL *</label>
                <div className="flex gap-3">
                  {(['低', '中', '高'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRisk(r)}
                      className={`
                        flex-1 py-3 rounded-lg font-mono font-bold uppercase tracking-wider transition-all
                        ${risk === r
                          ? r === '高' 
                            ? 'bg-danger-600 text-white shadow-lg shadow-danger-500/20' 
                            : r === '中' 
                              ? 'bg-hazard-500 text-surface-950 shadow-lg shadow-hazard-500/20'
                              : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-surface-800 border border-surface-700 text-surface-400 hover:border-surface-600'
                        }
                      `}
                    >
                      {r === '高' ? 'CRITICAL' : r === '中' ? 'WARNING' : 'LOW'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <FormInput label="Address *" name="address" placeholder="Street, City, State, Zip, Country" required />
              </div>
            </div>
          </section>

          {/* 纠纷类型 */}
          <section>
            <h3 className="text-xs font-mono font-medium text-surface-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-danger-500 rounded-full" />
              DISPUTE DETAILS
            </h3>
            <FormSelect
              label="Dispute Type *"
              value={disputeType}
              onChange={(e) => setDisputeType(e.target.value)}
              required
              options={[
                { value: '', label: 'Select Dispute Type' },
                { value: '仅退款（不退货）', label: 'Refund Only (No Return)' },
                { value: '虚假声称未收到', label: 'False "Not Received" Claim' },
                { value: '恶意差评勒索', label: 'Blackmail via Negative Review' },
                { value: '虚假纠纷/争议', label: 'False Dispute/Claim' },
                { value: '信用卡拒付欺诈', label: 'Credit Card Chargeback Fraud' },
                { value: '空包/重量纠纷', label: 'Empty Package/Weight Dispute' },
                { value: 'TRO律师事务所', label: 'TRO Law Firm' },
                { value: '品牌方钓鱼执法', label: 'Brand Entrapment' },
                { value: '恶意投诉侵权', label: 'Malicious IP Complaint' },
                { value: '虚假退货退款', label: 'False Return/Refund' },
                { value: '恶意索赔', label: 'Malicious Claim' },
                { value: '其他', label: 'Other' },
              ]}
            />
          </section>

          {/* 金额信息 */}
          <section>
            <h3 className="text-xs font-mono font-medium text-surface-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-hazard-500 rounded-full" />
              FINANCIAL INFO (OPTIONAL)
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <FormInput label="Order Amount" name="order_amount" type="number" step="0.01" placeholder="$ 0.00" />
              <FormInput label="Refund Amount" name="refund_amount" type="number" step="0.01" placeholder="$ 0.00" />
              <FormInput label="Partial Refund" name="partial_refund_amount" type="number" step="0.01" placeholder="$ 0.00" />
            </div>
          </section>

          {/* 货物损失 */}
          <section>
            <h3 className="text-xs font-mono font-medium text-surface-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-danger-500 rounded-full" />
              CARGO LOSS
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-surface-500 mb-2">HAS CARGO LOSS? *</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setHasCargoLoss(false)}
                    className={`
                      flex-1 py-3 rounded-lg font-mono font-bold uppercase transition-all
                      ${!hasCargoLoss 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                        : 'bg-surface-800 border border-surface-700 text-surface-400 hover:border-surface-600'
                      }
                    `}
                  >
                    NO
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasCargoLoss(true)}
                    className={`
                      flex-1 py-3 rounded-lg font-mono font-bold uppercase transition-all
                      ${hasCargoLoss 
                        ? 'bg-danger-600 text-white shadow-lg shadow-danger-500/20' 
                        : 'bg-surface-800 border border-surface-700 text-surface-400 hover:border-surface-600'
                      }
                    `}
                  >
                    YES
                  </button>
                </div>
              </div>

              {hasCargoLoss && (
                <div className="grid grid-cols-2 gap-4">
                  <FormInput label="Loss Amount" name="cargo_loss_amount" type="number" step="0.01" placeholder="$ 0.00" />
                  <div>
                    <label className="block text-xs font-mono text-surface-500 mb-2">LOSS BEARER</label>
                    <select name="loss_bearer" className="input-industrial">
                      <option value="">Select</option>
                      <option value="自己承担">Self</option>
                      <option value="平台承担">Platform</option>
                      <option value="部分承担">Partial</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 证据图片 */}
          {hasCargoLoss && (
            <section>
              <h3 className="text-xs font-mono font-medium text-surface-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-hazard-500 rounded-full" />
                EVIDENCE (OPTIONAL, MAX 5)
              </h3>
              <div
                className="border-2 border-dashed border-surface-700 rounded-lg p-8 text-center cursor-pointer hover:border-surface-600 transition-all"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <div className="w-12 h-12 mx-auto mb-3 bg-surface-800 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-surface-400 font-mono">CLICK TO UPLOAD</p>
                <p className="text-xs text-surface-600 mt-1">JPG, PNG · MAX 5MB EACH</p>
              </div>
              <input id="image-upload" type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
              {uploadedImages.length > 0 && (
                <div className="flex gap-3 flex-wrap mt-4">
                  {uploadedImages.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-surface-700 group">
                      <img src={url} className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => removeImage(i)} 
                        className="absolute top-1 right-1 w-5 h-5 bg-danger-600 rounded flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* 详细说明 */}
          <section>
            <h3 className="text-xs font-mono font-medium text-surface-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-hazard-500 rounded-full" />
              DESCRIPTION
            </h3>
            <textarea 
              name="description" 
              required 
              placeholder="Describe the situation: order number, amount, timeline, platform response..."
              className="input-industrial min-h-[120px] resize-none"
            />
          </section>

          {/* 举报人信息 */}
          <section>
            <FormInput label="Reporter Email (Optional, not public)" name="reporter_email" type="email" placeholder="Your email for review updates" />
          </section>

          {/* 提交按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-800">
            <button 
              type="button" 
              onClick={() => setOpen(false)} 
              className="btn-industrial"
            >
              CANCEL
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-industrial btn-industrial-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  SUBMITTING...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  SUBMIT REPORT
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormInput({ label, name, type = 'text', placeholder, required, step }: { 
  label: string; name: string; type?: string; placeholder?: string; required?: boolean; step?: string 
}) {
  return (
    <div>
      <label className="block text-xs font-mono text-surface-500 mb-2">{label}</label>
      <input 
        name={name} 
        type={type} 
        step={step}
        placeholder={placeholder} 
        required={required}
        className="input-industrial"
      />
    </div>
  )
}

function FormSelect({ label, value, onChange, options, required }: { 
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; 
  options: { value: string; label: string }[]; required?: boolean 
}) {
  return (
    <div>
      <label className="block text-xs font-mono text-surface-500 mb-2">{label}</label>
      <select value={value} onChange={onChange} required={required} className="input-industrial">
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
