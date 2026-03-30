'use client'

import { useState } from 'react'
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
    const configs: Record<string, { bg: string; text: string; border: string; dot: string }> = {
      '高': { bg: 'bg-danger-500/10', text: 'text-danger-400', border: 'border-danger-500/30', dot: 'status-dot-danger' },
      '中': { bg: 'bg-hazard-500/10', text: 'text-hazard-400', border: 'border-hazard-500/30', dot: 'status-dot-warning' },
      '低': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'status-dot-active' },
    }
    const config = configs[risk] || configs['低']
    
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono font-bold uppercase ${config.bg} ${config.text} border ${config.border}`}>
        <span className={`status-dot ${config.dot}`} />
        {risk} RISK
      </span>
    )
  }

  const relatedCount = (item.related_emails?.length || 0) + (item.related_phones?.length || 0)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        {/* 顶部警告条 */}
        <div className="h-1.5 bg-gradient-to-r from-danger-600 via-hazard-500 to-danger-600" />
        
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-danger-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-danger-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-100">{item.name}</h2>
              <p className="text-xs font-mono text-surface-500">BUYER PROFILE</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-800 border border-surface-700 text-surface-400 hover:bg-surface-700 hover:text-surface-200 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本信息 */}
          <section>
            <h3 className="text-xs font-mono font-medium text-surface-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-hazard-500 rounded-full" />
              BASIC INFORMATION
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="Risk Level" value={getRiskBadge(item.risk)} />
              <InfoField label="Platform" value={item.platform ? `${item.platform}${item.platform_id ? ` (${item.platform_id})` : ''}` : '-'} />
              <InfoField label="Dispute Type" value={item.dispute_type || '-'} />
              <InfoField label="Report Count" value={`${item.report_count || 1} times`} />
            </div>
          </section>

          {/* 联系信息 */}
          <section>
            <h3 className="text-xs font-mono font-medium text-surface-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-danger-500 rounded-full" />
              CONTACT INFORMATION
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="Email" value={item.email} mono />
              <InfoField label="Phone" value={item.phone || 'Not provided'} mono />
              <div className="col-span-2">
                <InfoField label="Address" value={`${item.address || 'Not provided'}${item.zip_code ? ` (${item.zip_code})` : ''}`} />
              </div>
            </div>
          </section>

          {/* 金额信息 */}
          <section>
            <h3 className="text-xs font-mono font-medium text-surface-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-hazard-500 rounded-full" />
              FINANCIAL DETAILS
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="Order Amount" value={formatCurrency(item.order_amount)} mono />
              <InfoField label="Refund Amount" value={formatCurrency(item.refund_amount)} mono danger />
              <InfoField label="Partial Refund" value={formatCurrency(item.partial_refund_amount)} mono />
              <InfoField 
                label="Cargo Loss" 
                value={
                  <span className={item.has_cargo_loss ? 'text-danger-400' : 'text-emerald-400'}>
                    {item.has_cargo_loss ? 'YES' : 'NO'}
                  </span>
                } 
              />
              {item.has_cargo_loss && (
                <>
                  <InfoField label="Loss Amount" value={formatCurrency(item.cargo_loss_amount)} mono />
                  <InfoField label="Loss Bearer" value={item.loss_bearer || '-'} />
                </>
              )}
            </div>
          </section>

          {/* 证据图片 */}
          {item.evidence_images && item.evidence_images.length > 0 && (
            <section>
              <h3 className="text-xs font-mono font-medium text-surface-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-hazard-500 rounded-full" />
                EVIDENCE ({item.evidence_images.length})
              </h3>
              <div className="flex gap-3 flex-wrap">
                {item.evidence_images.map((url, i) => (
                  <div 
                    key={i} 
                    className="w-24 h-24 rounded-lg overflow-hidden border border-surface-700 cursor-pointer hover:border-hazard-500/50 transition-all group"
                    onClick={() => window.open(url)}
                  >
                    <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 关联信息 */}
          {relatedCount > 1 && (
            <section>
              <h3 className="text-xs font-mono font-medium text-surface-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-danger-500 rounded-full" />
                LINKED RECORDS ({relatedCount})
              </h3>
              <div className="space-y-2">
                {item.related_emails && item.related_emails.length > 0 && (
                  <div className="p-3 bg-surface-800/50 rounded-lg border border-surface-700">
                    <div className="text-xs font-mono text-surface-500 mb-1">EMAILS</div>
                    <div className="font-mono text-sm text-surface-300">{item.related_emails.join(', ')}</div>
                  </div>
                )}
                {item.related_phones && item.related_phones.length > 0 && (
                  <div className="p-3 bg-surface-800/50 rounded-lg border border-surface-700">
                    <div className="text-xs font-mono text-surface-500 mb-1">PHONES</div>
                    <div className="font-mono text-sm text-surface-300">{item.related_phones.join(', ')}</div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 举报说明 */}
          <section>
            <h3 className="text-xs font-mono font-medium text-surface-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-hazard-500 rounded-full" />
              REPORT DESCRIPTION
            </h3>
            <div className="p-4 bg-surface-800/50 rounded-lg border border-surface-700">
              <div className="flex justify-between text-xs font-mono text-surface-500 mb-2">
                <span>Submitted {formatDate(item.created_at)}</span>
              </div>
              <p className="text-surface-300 leading-relaxed">{item.description || '-'}</p>
            </div>
          </section>
        </div>

        {/* 底部 */}
        <div className="px-6 py-4 border-t border-surface-800 bg-surface-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-surface-500">
              <span className="status-dot status-dot-active" />
              <span>RECORD ID: {item.id}</span>
            </div>
            <button
              onClick={onClose}
              className="btn-industrial"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoField({ label, value, mono, danger }: { label: string; value: React.ReactNode; mono?: boolean; danger?: boolean }) {
  return (
    <div className="p-3 bg-surface-800/30 rounded-lg border border-surface-700/50">
      <div className="text-xs font-mono text-surface-500 mb-1">{label}</div>
      <div className={`text-sm ${mono ? 'font-mono' : ''} ${danger ? 'text-danger-400' : 'text-surface-200'}`}>
        {value}
      </div>
    </div>
  )
}
