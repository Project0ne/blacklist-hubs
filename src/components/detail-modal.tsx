'use client'

import { useState } from 'react'
import { MergedBlacklistItem } from '@/types'
import { formatDate } from '@/lib/utils'

interface DetailModalProps {
  item: MergedBlacklistItem
  open: boolean
  onClose: () => void
  onReport?: () => void
}

export function DetailModal({ item, open, onClose, onReport }: DetailModalProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  if (!open) return null

  const getRiskBadge = (risk: string) => {
    const styles: Record<string, { bg: string; color: string; border: string; label: string }> = {
      '高': { bg: 'rgba(232,64,64,0.15)', color: '#ff6b6b', border: 'rgba(232,64,64,0.3)', label: '🔴 高风险' },
      '中': { bg: 'rgba(245,166,35,0.12)', color: '#f5a623', border: 'rgba(245,166,35,0.3)', label: '🔶 中风险' },
      '低': { bg: 'rgba(46,204,113,0.1)', color: '#2ecc71', border: 'rgba(46,204,113,0.2)', label: '⚠️ 低风险' },
    }
    const s = styles[risk] || styles['低']
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-[20px] text-[11px] font-bold"
        style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
      >
        {s.label}
      </span>
    )
  }

  const getPlatformBadge = (platform: string) => {
    const colors: Record<string, { border: string; color: string; bg: string }> = {
      'Amazon': { border: '#f90', color: '#f90', bg: 'rgba(255,153,0,0.08)' },
      'eBay': { border: '#4a90e2', color: '#4a90e2', bg: 'rgba(74,144,226,0.08)' },
      'Shopify': { border: '#96bf48', color: '#96bf48', bg: 'rgba(150,191,72,0.08)' },
      'AliExpress': { border: '#ff4c00', color: '#ff4c00', bg: 'rgba(255,76,0,0.08)' },
      'Wish': { border: '#a56eff', color: '#a56eff', bg: 'rgba(165,110,255,0.08)' },
    }
    const c = colors[platform] || { border: '#2e3350', color: '#8b90a7', bg: '#22263a' }
    return (
      <span
        key={platform}
        className="inline-block px-2 py-0.5 rounded text-[11px] mr-1"
        style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
      >
        {platform}
      </span>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-5"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[620px] max-h-[90vh] overflow-y-auto rounded-[14px] modal-animate"
        style={{ background: '#1a1d27', border: '1px solid #2e3350', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#2e3350' }}>
          <div className="text-[17px] font-bold" style={{ color: '#e8eaf0' }}>
            🔴 买家详情 — {item.name}
          </div>
          <button
            onClick={onClose}
            className="w-[30px] h-[30px] rounded-md flex items-center justify-center text-lg cursor-pointer leading-none transition-all duration-200"
            style={{ border: '1px solid #2e3350', background: 'transparent', color: '#8b90a7' }}
          >
            ×
          </button>
        </div>

        <div className="px-6 py-6">
          {/* 基本信息 */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#8b90a7', letterSpacing: 1 }}>基本信息</span>
              <div className="flex-1 h-px" style={{ background: '#2e3350' }} />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <DetailItem label="买家姓名" value={item.name} />
              <DetailItem label="风险等级" value={getRiskBadge(item.risk)} />
              <DetailItem label="平台" value={
                item.platforms.length > 0 
                  ? <div className="flex flex-wrap gap-1">{item.platforms.map(p => getPlatformBadge(p))}</div>
                  : '—'
              } />
              <DetailItem label="纠纷类型" value={
                item.dispute_types.length > 0 
                  ? <div className="flex flex-wrap gap-1">{item.dispute_types.map((dt, i) => (
                      <span key={i} className="inline-block px-2 py-0.5 rounded text-[11px]" style={{ background: 'rgba(232,64,64,0.1)', border: '1px solid rgba(232,64,64,0.2)', color: '#ff6b6b' }}>
                        {dt}
                      </span>
                    ))}</div>
                  : '—'
              } />
              <DetailItem label="举报次数" value={`${item.report_count} 次`} />
              <DetailItem label="白嫖金额" value={
                item.refund_total > 0 
                  ? <span style={{ color: '#ff6b6b', fontWeight: 600 }}>${item.refund_total.toFixed(2)}</span>
                  : '—'
              } />
            </div>
          </div>

          {/* 联系与地址 */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#8b90a7', letterSpacing: 1 }}>联系与地址</span>
              <div className="flex-1 h-px" style={{ background: '#2e3350' }} />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <DetailItem label="邮箱地址" value={item.emails.join(', ')} />
              <DetailItem label="电话号码" value={item.phones.join(', ') || '未提供'} />
              <DetailItem label="收货地址" value={item.addresses.join(' | ') || '未提供'} full />
            </div>
          </div>

          {/* 关联账号 */}
          {item.emails.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#8b90a7', letterSpacing: 1 }}>关联账号</span>
                <div className="flex-1 h-px" style={{ background: '#2e3350' }} />
              </div>
              <div className="flex gap-1.5 flex-wrap mt-2">
                {item.emails.map((e, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs"
                    style={{ background: 'rgba(232,64,64,0.08)', border: '1px solid rgba(232,64,64,0.2)', color: '#ff6b6b' }}
                  >
                    🔗 {e}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 举报记录（按每条记录显示） */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#8b90a7', letterSpacing: 1 }}>举报内容（{item.records.length} 条）</span>
              <div className="flex-1 h-px" style={{ background: '#2e3350' }} />
            </div>
            <div className="space-y-3">
              {item.records.map((record, idx) => (
                <div key={record.id} style={{ background: '#22263a', border: '1px solid #2e3350', borderRadius: 7, padding: '12px 14px' }}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: '#e8eaf0' }}>举报 #{idx + 1}</span>
                      {record.platform && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,153,0,0.1)', color: '#f5a623' }}>
                          {record.platform}
                        </span>
                      )}
                      {record.dispute_type && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(232,64,64,0.1)', color: '#ff6b6b' }}>
                          {record.dispute_type}
                        </span>
                      )}
                      {record.refund_amount && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(232,64,64,0.1)', color: '#ff6b6b' }}>
                          ${record.refund_amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px]" style={{ color: '#8b90a7' }}>{formatDate(record.created_at)}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#e8eaf0' }}>
                    {record.description || '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 证据截图 */}
          {item.evidence_images.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#8b90a7', letterSpacing: 1 }}>证据截图</span>
                <div className="flex-1 h-px" style={{ background: '#2e3350' }} />
              </div>
              <div className="flex gap-2.5 flex-wrap">
                {item.evidence_images.map((url, i) => (
                  <div
                    key={i}
                    className="w-20 h-20 rounded-lg overflow-hidden cursor-pointer border hover:opacity-80 transition"
                    style={{ borderColor: '#2e3350' }}
                    onClick={() => setLightboxImage(url)}
                  >
                    <img src={url} alt={`证据 ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex gap-2.5 justify-end" style={{ borderColor: '#2e3350' }}>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-[7px] text-sm cursor-pointer transition-all duration-200"
            style={{ background: 'transparent', border: '1px solid #2e3350', color: '#8b90a7' }}
          >
            关闭
          </button>
          <button
            onClick={() => { onClose(); onReport?.(); }}
            className="px-6 py-2.5 rounded-[7px] text-sm font-semibold text-white cursor-pointer transition-all duration-200"
            style={{ background: '#e84040', border: 'none' }}
          >
            补充举报
          </button>
        </div>
      </div>

      {/* 灯箱 */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-5"
          style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)' }}
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center text-white text-2xl hover:bg-white/10 transition"
            onClick={() => setLightboxImage(null)}
          >
            ×
          </button>
          <img
            src={lightboxImage}
            alt="预览"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

function DetailItem({ label, value, full }: { label: string; value: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <div className="flex flex-col gap-[3px]">
        <div className="text-[11px]" style={{ color: '#8b90a7' }}>{label}</div>
        <div
          className="text-sm px-2.5 py-1.5 rounded-[5px] break-all"
          style={{ color: '#e8eaf0', background: '#22263a', border: '1px solid #2e3350' }}
        >
          {value}
        </div>
      </div>
    </div>
  )
}
