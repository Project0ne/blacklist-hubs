'use client'

import { useState } from 'react'
import { BlacklistItem } from '@/types'
import { DetailModal } from '@/components/detail-modal'
import { formatCurrency, formatDate, maskEmail, maskPhone, maskAddress } from '@/lib/utils'

interface BlacklistTableProps {
  items: BlacklistItem[]
  loading: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function BlacklistTable({ items, loading, currentPage, totalPages, onPageChange }: BlacklistTableProps) {
  const [selectedItem, setSelectedItem] = useState<BlacklistItem | null>(null)

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
        {risk}
      </span>
    )
  }

  const getPlatformBadge = (platform: string | undefined) => {
    if (!platform) return <span className="text-surface-600 font-mono text-xs">N/A</span>
    
    const colors: Record<string, string> = {
      'Amazon': 'text-orange-400 border-orange-500/30',
      'eBay': 'text-blue-400 border-blue-500/30',
      'Shopify': 'text-emerald-400 border-emerald-500/30',
      'AliExpress': 'text-red-400 border-red-500/30',
      'Wish': 'text-purple-400 border-purple-500/30',
    }
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-mono border ${colors[platform] || 'text-surface-400 border-surface-600'}`}>
        {platform.toUpperCase()}
      </span>
    )
  }

  const getRelatedBadge = (item: BlacklistItem) => {
    const count = (item.related_emails?.length || 0) + (item.related_phones?.length || 0)
    if (count <= 1) return <span className="text-surface-600 font-mono text-xs">-</span>
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono bg-danger-500/10 text-danger-400 border border-danger-500/20">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        {count}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="industrial-panel p-6">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-surface-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="industrial-panel overflow-hidden">
        {/* 表格头部警告条 */}
        <div className="h-1 bg-gradient-to-r from-hazard-600 via-surface-700 to-hazard-600" />
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-800/50 border-b border-surface-700">
                <th className="px-4 py-3 text-left text-xs font-mono font-medium text-surface-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-mono font-medium text-surface-500 uppercase tracking-wider">BUYER</th>
                <th className="px-4 py-3 text-left text-xs font-mono font-medium text-surface-500 uppercase tracking-wider">PLATFORM</th>
                <th className="px-4 py-3 text-left text-xs font-mono font-medium text-surface-500 uppercase tracking-wider">EMAIL</th>
                <th className="px-4 py-3 text-left text-xs font-mono font-medium text-surface-500 uppercase tracking-wider">PHONE</th>
                <th className="px-4 py-3 text-left text-xs font-mono font-medium text-surface-500 uppercase tracking-wider">RISK</th>
                <th className="px-4 py-3 text-left text-xs font-mono font-medium text-surface-500 uppercase tracking-wider">LINKED</th>
                <th className="px-4 py-3 text-left text-xs font-mono font-medium text-surface-500 uppercase tracking-wider">DATE</th>
                <th className="px-4 py-3 text-left text-xs font-mono font-medium text-surface-500 uppercase tracking-wider">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center">
                        <svg className="w-8 h-8 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <span className="text-surface-500 font-mono text-sm">NO RECORDS FOUND</span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr 
                    key={item.id} 
                    className="border-t border-surface-800 hover:bg-surface-800/30 transition-colors group"
                  >
                    <td className="px-4 py-4 font-mono text-surface-600 text-sm">
                      {(currentPage - 1) * 10 + index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-surface-200">{item.name}</div>
                      <div className="text-xs text-surface-500 font-mono mt-0.5">{item.dispute_type || '-'}</div>
                    </td>
                    <td className="px-4 py-4">{getPlatformBadge(item.platform)}</td>
                    <td className="px-4 py-4 font-mono text-sm text-surface-300">{maskEmail(item.email)}</td>
                    <td className="px-4 py-4 font-mono text-sm text-surface-400">{maskPhone(item.phone)}</td>
                    <td className="px-4 py-4">{getRiskBadge(item.risk)}</td>
                    <td className="px-4 py-4">{getRelatedBadge(item)}</td>
                    <td className="px-4 py-4 font-mono text-xs text-surface-500">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-4 py-1.5 rounded text-xs font-mono font-medium
                          bg-surface-800 border border-surface-700 text-surface-400
                          hover:bg-surface-700 hover:border-surface-600 hover:text-surface-200
                          transition-all"
                      >
                        VIEW
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-surface-800">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-800 border border-surface-700 text-surface-400 hover:bg-surface-700 hover:text-surface-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i
                if (pageNum > totalPages) return null
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`
                      w-10 h-10 flex items-center justify-center rounded-lg font-mono text-sm
                      transition-all
                      ${currentPage === pageNum
                        ? 'bg-hazard-500 text-surface-950 font-bold shadow-lg shadow-hazard-500/20'
                        : 'bg-surface-800 border border-surface-700 text-surface-400 hover:bg-surface-700 hover:text-surface-200'
                      }
                    `}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-800 border border-surface-700 text-surface-400 hover:bg-surface-700 hover:text-surface-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {selectedItem && (
        <DetailModal item={selectedItem} open={!!selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </>
  )
}
