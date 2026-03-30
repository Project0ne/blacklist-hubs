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
    const icons: Record<string, string> = { '高': '🔴', '中': '🔶', '低': '⚠️' }
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${styles[risk] || ''}`}>
        {icons[risk]} {risk}风险
      </span>
    )
  }

  const relatedCount = (item.related_emails?.length || 0) + (item.related_phones?.length || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">🔴 买家详情 — {item.name}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded border border-gray-700 hover:border-red-500 transition">
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">基本信息</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">买家姓名</div>
                <div className="bg-gray-800 p-2 rounded text-sm">{item.name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">风险等级</div>
                <div className="bg-gray-800 p-2 rounded">{getRiskBadge(item.risk)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">平台</div>
                <div className="bg-gray-800 p-2 rounded text-sm">{item.platform || '-'} {item.platform_id ? `(${item.platform_id})` : ''}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">纠纷类型</div>
                <div className="bg-gray-800 p-2 rounded text-sm">{item.dispute_type || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">举报次数</div>
                <div className="bg-gray-800 p-2 rounded text-sm">{item.report_count || 1} 次</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">最近举报</div>
                <div className="bg-gray-800 p-2 rounded text-sm">{formatDate(item.created_at)}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">联系与地址</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">邮箱地址</div>
                <div className="bg-gray-800 p-2 rounded text-sm">{item.email}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">电话号码</div>
                <div className="bg-gray-800 p-2 rounded text-sm">{item.phone || '未提供'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-gray-500 mb-1">收货地址</div>
                <div className="bg-gray-800 p-2 rounded text-sm">{item.address || '未提供'} {item.zip_code ? `(${item.zip_code})` : ''}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">金额信息</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">总订单金额</div>
                <div className="bg-gray-800 p-2 rounded text-sm">{formatCurrency(item.order_amount)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">退款/拒付金额</div>
                <div className="bg-gray-800 p-2 rounded text-sm">{formatCurrency(item.refund_amount)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">威胁拒付金额</div>
                <div className="bg-gray-800 p-2 rounded text-sm">{formatCurrency(item.partial_refund_amount)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">是否有货物损失</div>
                <div className="bg-gray-800 p-2 rounded text-sm">{item.has_cargo_loss ? '❌ 是' : '✅ 否'}</div>
              </div>
              {item.has_cargo_loss && (
                <>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">货物损失金额</div>
                    <div className="bg-gray-800 p-2 rounded text-sm">{formatCurrency(item.cargo_loss_amount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">损失承担方</div>
                    <div className="bg-gray-800 p-2 rounded text-sm">{item.loss_bearer || '未填写'}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {item.evidence_images && item.evidence_images.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">损失截图</h3>
              <div className="flex gap-2 flex-wrap">
                {item.evidence_images.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    className="w-24 h-24 object-cover rounded cursor-pointer hover:opacity-80 transition"
                    onClick={() => window.open(url)}
                  />
                ))}
              </div>
            </div>
          )}

          {relatedCount > 1 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">🔗 关联信息（共 {relatedCount} 条记录）</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">关联邮箱</div>
                  <div className="bg-gray-800 p-2 rounded text-sm">
                    {item.related_emails?.map(e => `📧 ${e}`).join('\n') || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">关联手机</div>
                  <div className="bg-gray-800 p-2 rounded text-sm">
                    {item.related_phones?.map(p => `📱 ${p}`).join('\n') || '-'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">举报内容</h3>
            <div className="bg-gray-800 p-3 rounded">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>举报说明</span>
                <span>{formatDate(item.created_at)}</span>
              </div>
              <div className="text-sm leading-relaxed">{item.description || '-'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
