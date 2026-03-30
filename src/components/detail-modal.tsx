'use client'

import { BlacklistItem } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface DetailModalProps {
  item: BlacklistItem
  open: boolean
  onClose: () => void
}

export function DetailModal({ item, open, onClose }: DetailModalProps) {
  if (!open) return null

  const getRiskBadge = (risk: string) => {
    const styles: Record<string, string> = {
      '高': 'bg-red-500/20 text-red-400 border-red-500/30',
      '中': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      '低': 'bg-green-500/20 text-green-400 border-green-500/30',
    }
    const colors: Record<string, string> = { '高': 'bg-red-500', '中': 'bg-yellow-500', '低': 'bg-green-500' }
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles[risk] || ''}`}>
        <span className={`w-2 h-2 rounded-full ${colors[risk] || ''}`} />
        {risk}风险
      </span>
    )
  }

  const relatedCount = (item.related_emails?.length || 0) + (item.related_phones?.length || 0)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#161822] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#161822]/95 backdrop-blur-sm border-b border-gray-800 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{item.name}</h2>
              <p className="text-xs text-gray-500">买家详情</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white transition">
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本信息 */}
          <section>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">基本信息</h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="风险等级" value={getRiskBadge(item.risk)} />
              <InfoField label="平台" value={item.platform || '-'} />
              <InfoField label="平台 ID" value={item.platform_id || '-'} />
              <InfoField label="纠纷类型" value={item.dispute_type || '-'} />
              <InfoField label="举报次数" value={`${item.report_count || 1} 次`} />
              <InfoField label="最近举报" value={formatDate(item.created_at)} />
            </div>
          </section>

          {/* 联系信息 */}
          <section>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">联系与地址</h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="邮箱地址" value={item.email} />
              <InfoField label="电话号码" value={item.phone || '未提供'} />
              <div className="col-span-2">
                <InfoField label="收货地址" value={`${item.address || '未提供'}${item.zip_code ? ` (${item.zip_code})` : ''}`} />
              </div>
            </div>
          </section>

          {/* 金额信息 */}
          <section>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">金额信息</h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="总订单金额" value={formatCurrency(item.order_amount)} />
              <InfoField label="退款/拒付金额" value={formatCurrency(item.refund_amount)} highlight />
              <InfoField label="威胁拒付金额" value={formatCurrency(item.partial_refund_amount)} />
              <InfoField label="是否有货物损失" value={item.has_cargo_loss ? '是' : '否'} />
              {item.has_cargo_loss && (
                <>
                  <InfoField label="货物损失金额" value={formatCurrency(item.cargo_loss_amount)} />
                  <InfoField label="损失承担方" value={item.loss_bearer || '未填写'} />
                </>
              )}
            </div>
          </section>

          {/* 证据图片 */}
          {item.evidence_images && item.evidence_images.length > 0 && (
            <section>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">证据截图</h3>
              <div className="flex gap-3 flex-wrap">
                {item.evidence_images.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    className="w-24 h-24 object-cover rounded-lg border border-gray-700 cursor-pointer hover:border-red-500/50 transition"
                    onClick={() => window.open(url)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 关联信息 */}
          {relatedCount > 1 && (
            <section>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">关联信息（共 {relatedCount} 条记录）</h3>
              <div className="space-y-2">
                {item.related_emails && item.related_emails.length > 0 && (
                  <div className="p-3 bg-[#1a1d27] rounded-lg border border-gray-800">
                    <div className="text-xs text-gray-500 mb-1">关联邮箱</div>
                    <div className="text-sm text-gray-300">{item.related_emails.join(', ')}</div>
                  </div>
                )}
                {item.related_phones && item.related_phones.length > 0 && (
                  <div className="p-3 bg-[#1a1d27] rounded-lg border border-gray-800">
                    <div className="text-xs text-gray-500 mb-1">关联手机</div>
                    <div className="text-sm text-gray-300">{item.related_phones.join(', ')}</div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 举报内容 */}
          <section>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">举报内容</h3>
            <div className="p-4 bg-[#1a1d27] rounded-lg border border-gray-800">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>举报说明</span>
                <span>{formatDate(item.created_at)}</span>
              </div>
              <p className="text-gray-300 leading-relaxed">{item.description || '-'}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function InfoField({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="p-3 bg-[#1a1d27] rounded-lg border border-gray-800/50">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-sm ${highlight ? 'text-red-400' : 'text-gray-200'}`}>
        {value}
      </div>
    </div>
  )
}
