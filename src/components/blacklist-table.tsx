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

  const getPlatformBadge = (platform: string | undefined) => {
    if (!platform) return <span className="text-gray-500">-</span>
    const colors: Record<string, string> = {
      'Amazon': 'border-orange-500 text-orange-400',
      'eBay': 'border-blue-500 text-blue-400',
      'Shopify': 'border-green-500 text-green-400',
      'AliExpress': 'border-red-500 text-red-400',
      'Wish': 'border-purple-500 text-purple-400',
    }
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs border ${colors[platform] || 'border-gray-500 text-gray-400'}`}>
        {platform}
      </span>
    )
  }

  const getRelatedBadge = (item: BlacklistItem) => {
    const count = (item.related_emails?.length || 0) + (item.related_phones?.length || 0)
    if (count <= 1) return <span className="text-gray-500">-</span>
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
        🔗 {count}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 text-left">
                <th className="px-4 py-3 text-xs text-gray-400 font-medium">#</th>
                <th className="px-4 py-3 text-xs text-gray-400 font-medium">买家姓名</th>
                <th className="px-4 py-3 text-xs text-gray-400 font-medium">平台</th>
                <th className="px-4 py-3 text-xs text-gray-400 font-medium">邮箱</th>
                <th className="px-4 py-3 text-xs text-gray-400 font-medium">电话</th>
                <th className="px-4 py-3 text-xs text-gray-400 font-medium">地址</th>
                <th className="px-4 py-3 text-xs text-gray-400 font-medium">风险</th>
                <th className="px-4 py-3 text-xs text-gray-400 font-medium">关联</th>
                <th className="px-4 py-3 text-xs text-gray-400 font-medium">时间</th>
                <th className="px-4 py-3 text-xs text-gray-400 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-2">🔍</div>
                    <div>未找到相关记录</div>
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition">
                    <td className="px-4 py-3 text-sm text-gray-500">{(currentPage - 1) * 10 + index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.dispute_type}</div>
                    </td>
                    <td className="px-4 py-3">{getPlatformBadge(item.platform)}</td>
                    <td className="px-4 py-3 text-sm">{maskEmail(item.email)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{maskPhone(item.phone)}</td>
                    <td className="px-4 py-3 text-sm max-w-[160px] truncate">{maskAddress(item.address)}</td>
                    <td className="px-4 py-3">{getRiskBadge(item.risk)}</td>
                    <td className="px-4 py-3">{getRelatedBadge(item)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-3 py-1 text-sm border border-gray-700 rounded hover:border-red-500 hover:text-red-400 transition"
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-800">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center border border-gray-700 rounded hover:border-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ‹
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => onPageChange(i + 1)}
                className={`w-8 h-8 flex items-center justify-center rounded transition ${
                  currentPage === i + 1
                    ? 'bg-red-600 text-white'
                    : 'border border-gray-700 hover:border-red-500'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center border border-gray-700 rounded hover:border-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ›
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
