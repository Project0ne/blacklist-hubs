'use client'

import { MergedBlacklistItem } from '@/types'
import { formatDate } from '@/lib/utils'

interface BlacklistTableProps {
  items: MergedBlacklistItem[]
  loading: boolean
  currentPage: number
  totalPages: number
  totalRows: number
  onPageChange: (page: number) => void
  onViewDetail: (item: MergedBlacklistItem) => void
}

export function BlacklistTable({ items, loading, currentPage, totalPages, totalRows, onPageChange, onViewDetail }: BlacklistTableProps) {
  const getRiskBadge = (risk: string) => {
    const styles: Record<string, { bg: string; color: string; border: string; icon: string; label: string }> = {
      '高': { bg: 'rgba(239,68,68,0.18)', color: '#f87171', border: 'rgba(239,68,68,0.4)', icon: '●', label: '高风险' },
      '中': { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.35)', icon: '◆', label: '中风险' },
      '低': { bg: 'rgba(234,179,8,0.12)', color: '#eab308', border: 'rgba(234,179,8,0.3)', icon: '▲', label: '低风险' },
    }
    const s = styles[risk] || styles['低']
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold"
        style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
      >
        <span style={{ fontSize: 10 }}>{s.icon}</span> {s.label}
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
      'Alibaba': { border: '#ff6a00', color: '#ff6a00', bg: 'rgba(255,106,0,0.08)' },
    }
    const c = colors[platform] || { border: '#2e3350', color: '#8b90a7', bg: '#22263a' }
    return (
      <span
        key={platform}
        className="inline-block px-2 py-0.5 rounded text-[11px] mr-1 mb-1"
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

  const HEADERS = ['#', '买家姓名', '平台 / ID', '邮箱地址', '电话号码', '收货地址', '风险等级', '白嫖金额', '举报次数', '最近时间', '操作']

  if (loading) {
    return (
      <div style={{ background: '#1a1d27', border: '1px solid #2e3350', borderRadius: 10, overflow: 'hidden' }}>
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#22263a' }}>
              {HEADERS.map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#8b90a7', letterSpacing: '0.5px' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {[...Array(11)].map((_, j) => (
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
              {HEADERS.map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#8b90a7', letterSpacing: '0.5px' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-16" style={{ color: '#8b90a7' }}>
                  <div className="text-4xl mb-2">🔍</div>
                  <div className="font-bold" style={{ color: '#e8eaf0' }}>未找到相关记录</div>
                  <p className="text-sm mt-1.5">尝试其他关键词，或提交新的举报</p>
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr
                  key={item.buyer_group_id}
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
                    <span className="text-[11px]" style={{ color: '#8b90a7' }}>
                      {item.dispute_types.join(' · ') || ''}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap">
                      {item.platforms.length > 0
                        ? item.platforms.map(p => getPlatformBadge(p))
                        : <span style={{ color: '#8b90a7' }}>—</span>
                      }
                    </div>
                    {item.platform_ids.length > 0 && (
                      <span className="block text-[11px] mt-1" style={{ color: '#8b90a7' }}>
                        {item.platform_ids.join(', ')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-sm">
                    <span 
                      className="cursor-pointer select-none transition-all duration-200" 
                      onClick={() => onViewDetail(item)} 
                      style={{ color: '#e8eaf0', filter: 'blur(4px)' }}
                      onMouseEnter={e => (e.currentTarget.style.filter = 'blur(0px)')}
                      onMouseLeave={e => (e.currentTarget.style.filter = 'blur(4px)')}
                    >
                      {item.emails[0] || '—'}
                    </span>
                    {item.emails.length > 1 && (
                      <span className="text-[10px] ml-1" style={{ color: '#8b90a7' }}>+{item.emails.length - 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-sm">
                    <span 
                      className="cursor-pointer select-none transition-all duration-200" 
                      onClick={() => onViewDetail(item)} 
                      style={{ color: '#8b90a7', filter: 'blur(4px)' }}
                      onMouseEnter={e => (e.currentTarget.style.filter = 'blur(0px)')}
                      onMouseLeave={e => (e.currentTarget.style.filter = 'blur(4px)')}
                    >
                      {item.phones[0] || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm" style={{ maxWidth: 160 }}>
                    <span 
                      className="cursor-pointer select-none transition-all duration-200" 
                      onClick={() => onViewDetail(item)} 
                      style={{ color: '#8b90a7', filter: 'blur(4px)' }}
                      onMouseEnter={e => (e.currentTarget.style.filter = 'blur(0px)')}
                      onMouseLeave={e => (e.currentTarget.style.filter = 'blur(4px)')}
                    >
                      {item.addresses[0] || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">{getRiskBadge(item.risk)}</td>
                  <td className="px-4 py-3.5 text-sm">
                    {item.refund_total > 0
                      ? <span style={{ color: '#ff6b6b', fontWeight: 600 }}>${item.refund_total.toFixed(2)}</span>
                      : <span style={{ color: '#8b90a7' }}>—</span>
                    }
                  </td>
                  <td className="px-4 py-3.5">{getReportCountBadge(item.report_count)}</td>
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
