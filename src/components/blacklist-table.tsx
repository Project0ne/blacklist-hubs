'use client'

import { BlacklistItem } from '@/types'
import { formatDate, maskEmail, maskPhone, maskAddress } from '@/lib/utils'

interface BlacklistTableProps {
  items: BlacklistItem[]
  loading: boolean
  currentPage: number
  totalPages: number
  totalRows: number
  onPageChange: (page: number) => void
  onViewDetail: (item: BlacklistItem) => void
}

export function BlacklistTable({ items, loading, currentPage, totalPages, totalRows, onPageChange, onViewDetail }: BlacklistTableProps) {
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

  const getPlatformBadge = (platform: string | undefined) => {
    if (!platform) return <span style={{ color: '#8b90a7' }}>—</span>
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
        className="inline-block px-2 py-0.5 rounded text-[11px]"
        style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
      >
        {platform}
      </span>
    )
  }

  const getReportCountBadge = (count: number) => {
    const style = count >= 5
      ? { bg: 'rgba(232,64,64,0.2)', color: '#ff6b6b' }
      : count >= 3
        ? { bg: 'rgba(245,166,35,0.2)', color: '#f5a623' }
        : { bg: 'rgba(139,144,167,0.15)', color: '#8b90a7' }
    return (
      <span
        className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full text-[11px] font-bold"
        style={{ background: style.bg, color: style.color }}
      >
        {count}
      </span>
    )
  }

  if (loading) {
    return (
      <div style={{ background: '#1a1d27', border: '1px solid #2e3350', borderRadius: 10, overflow: 'hidden' }}>
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#22263a' }}>
              {['#', '买家姓名', '平台 / ID', '邮箱地址', '电话号码', '收货地址', '风险等级', '举报次数', '最近时间', '操作'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#8b90a7', letterSpacing: '0.5px' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {[...Array(10)].map((_, j) => (
                  <td key={j} className="px-4 py-4">
                    <div className="skeleton-bar" style={{ width: '80%' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div style={{ background: '#1a1d27', border: '1px solid #2e3350', borderRadius: 10, overflow: 'hidden' }}>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#22263a' }}>
              {['#', '买家姓名', '平台 / ID', '邮箱地址', '电话号码', '收货地址', '风险等级', '举报次数', '最近时间', '操作'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#8b90a7', letterSpacing: '0.5px' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-16" style={{ color: '#8b90a7' }}>
                  <div className="text-4xl mb-2">🔍</div>
                  <div className="font-bold" style={{ color: '#e8eaf0' }}>未找到相关记录</div>
                  <p className="text-sm mt-1.5">尝试其他关键词，或提交新的举报</p>
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr
                  key={item.id}
                  className="transition-colors duration-150"
                  style={{ borderTop: '1px solid #2e3350' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-4 py-3.5 text-xs" style={{ color: '#8b90a7' }}>
                    {(currentPage - 1) * 10 + index + 1}
                  </td>
                  <td className="px-4 py-3.5">
                    <strong style={{ color: '#e8eaf0' }}>{item.name}</strong>
                    <br />
                    <span className="text-[11px]" style={{ color: '#8b90a7' }}>{item.dispute_type || ''}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    {getPlatformBadge(item.platform)}
                    {item.platform_id && (
                      <span className="block text-[11px] mt-1" style={{ color: '#8b90a7' }}>{item.platform_id}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-sm">
                    <span className="masked" onClick={() => onViewDetail(item)} style={{ color: '#e8eaf0' }}>
                      {maskEmail(item.email)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm">
                    <span className="masked" onClick={() => onViewDetail(item)} style={{ color: '#8b90a7' }}>
                      {maskPhone(item.phone)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm" style={{ maxWidth: 160 }}>
                    <span className="masked" onClick={() => onViewDetail(item)} style={{ color: '#8b90a7' }}>
                      {maskAddress(item.address)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">{getRiskBadge(item.risk)}</td>
                  <td className="px-4 py-3.5">{getReportCountBadge(item.report_count || 1)}</td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: '#8b90a7' }}>
                    {formatDate(item.created_at)}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => onViewDetail(item)}
                      className="px-3 py-1 rounded text-xs cursor-pointer transition-all duration-200"
                      style={{ background: 'transparent', border: '1px solid #2e3350', color: '#8b90a7' }}
                      onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#e84040'; (e.target as HTMLElement).style.color = '#ff6b6b' }}
                      onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#2e3350'; (e.target as HTMLElement).style.color = '#8b90a7' }}
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
        <div className="flex items-center justify-center gap-1.5 p-5" style={{ borderTop: '1px solid #2e3350' }}>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded flex items-center justify-center text-sm cursor-pointer transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'transparent', border: '1px solid #2e3350', color: '#8b90a7' }}
          >
            ‹
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => onPageChange(i + 1)}
              className="w-8 h-8 rounded flex items-center justify-center text-sm cursor-pointer transition-all duration-200"
              style={{
                background: currentPage === i + 1 ? '#e84040' : 'transparent',
                border: `1px solid ${currentPage === i + 1 ? '#e84040' : '#2e3350'}`,
                color: currentPage === i + 1 ? '#fff' : '#8b90a7',
              }}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded flex items-center justify-center text-sm cursor-pointer transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'transparent', border: '1px solid #2e3350', color: '#8b90a7' }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}
