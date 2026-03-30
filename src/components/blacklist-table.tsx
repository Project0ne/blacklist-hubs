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
    const colors: Record<string, string> = { '高': 'bg-red-500', '中': 'bg-yellow-500', '低': 'bg-green-500' }
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles[risk] || ''}`}>
        <span className={`w-2 h-2 rounded-full ${colors[risk] || ''}`} />
        {risk}风险
      </span>
    )
  }

  const getPlatformBadge = (platform: string | undefined) => {
    if (!platform) return <span className="text-gray-500">-</span>
    const colors: Record<string, string> = {
      'Amazon': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'eBay': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Shopify': 'bg-green-500/20 text-green-400 border-green-500/30',
      'AliExpress': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Wish': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    }
    return (
      <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${colors[platform] || 'border-gray-500 text-gray-400'}`}>
        {platform}
      </span>
    )
  }

  const getRelatedBadge = (item: BlacklistItem) => {
    const count = (item.related_emails?.length || 0) + (item.related_phones?.length || 0)
    if (count <= 1) return <span className="text-gray-500">-</span>
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
        {count}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="bg-[#161822] border border-gray-800/50 rounded-xl p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-800/30 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-[#161822] border border-gray-800/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1a1d27]/50 border-b border-gray-800/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">买家姓名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">平台 / ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">邮箱地址</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">电话号码</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">风险等级</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">举报次数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">最近时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-500">
                    <div className="text-4xl mb-2">🔍</div>
                    <div>未找到相关记录</div>
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item.id} className="border-t border-gray-800/30 hover:bg-gray-800/20 transition">
                    <td className="px-4 py-4 text-sm text-gray-500">{(currentPage - 1) * 10 + index + 1}</td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.dispute_type}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div>{getPlatformBadge(item.platform)}</div>
                      {item.platform_id && (
                        <div className="text-xs text-gray-500 mt-1">{item.platform_id}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-300">{maskEmail(item.email)}</td>
                    <td className="px-4 py-4 text-sm text-gray-400">{maskPhone(item.phone)}</td>
                    <td className="px-4 py-4">{getRiskBadge(item.risk)}</td>
                    <td className="px-4 py-4">{getRelatedBadge(item)}</td>
                    <td className="px-4 py-4 text-sm text-gray-400">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-4 py-1.5 text-sm border border-gray-700 rounded-lg text-gray-300 hover:border-red-500 hover:text-red-400 transition"
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

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-800/50">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center border border-gray-700 rounded-lg text-gray-400 hover:border-red-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              ‹
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => onPageChange(i + 1)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition ${
                  currentPage === i + 1
                    ? 'bg-red-500 text-white'
                    : 'border border-gray-700 text-gray-400 hover:border-red-500'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-10 h-10 flex items-center justify-center border border-gray-700 rounded-lg text-gray-400 hover:border-red-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
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
