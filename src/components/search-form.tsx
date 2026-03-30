'use client'

import { useState } from 'react'

interface SearchFormProps {
  onSearch: (query: string, type: string, risk: string, platform: string, sort: string) => void
}

export function SearchForm({ onSearch }: SearchFormProps) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [risk, setRisk] = useState('')
  const [platform, setPlatform] = useState('')
  const [sort, setSort] = useState('created_at')

  const handleSearch = () => {
    onSearch(query, type, risk, platform, sort)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handlePlatform = (p: string) => {
    setPlatform(p)
    onSearch(query, type, risk, p, sort)
  }

  const platforms = ['Amazon', 'eBay', 'Shopify', 'AliExpress', 'Wish']

  return (
    <div className="mb-7">
      {/* 搜索框 - 统一容器 */}
      <div
        className="flex items-center gap-3 rounded-[10px] px-2 py-2 mb-2.5 transition-colors duration-200"
        style={{ background: '#1a1d27', border: '1px solid #2e3350' }}
        onFocusCapture={e => (e.currentTarget.style.borderColor = '#e84040')}
        onBlurCapture={e => (e.currentTarget.style.borderColor = '#2e3350')}
      >
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="px-3 py-2 rounded-md text-xs outline-none cursor-pointer"
          style={{ background: '#22263a', border: '1px solid #2e3350', color: '#e8eaf0' }}
        >
          <option value="all">全部字段</option>
          <option value="name">买家姓名</option>
          <option value="email">邮箱地址</option>
          <option value="phone">电话号码</option>
          <option value="address">收货地址</option>
          <option value="platform_id">平台 ID</option>
        </select>
        <input
          placeholder="输入买家姓名、邮箱、电话或地址进行查询..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-sm px-1 py-2"
          style={{ color: '#e8eaf0' }}
        />
        <button
          onClick={handleSearch}
          className="px-6 py-2.5 rounded-md text-sm font-semibold text-white cursor-pointer whitespace-nowrap transition-colors duration-200"
          style={{ background: '#e84040', border: 'none' }}
          onMouseEnter={e => (e.target as HTMLElement).style.background = '#ff6b6b'}
          onMouseLeave={e => (e.target as HTMLElement).style.background = '#e84040'}
        >
          🔍 查询
        </button>
      </div>

      {/* 平台标签 - 胶囊形状 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {platforms.map(p => (
          <span
            key={p}
            onClick={() => handlePlatform(p)}
            className="px-3 py-1 rounded-[20px] text-xs cursor-pointer transition-all duration-200"
            style={{
              background: platform === p ? 'rgba(232,64,64,0.08)' : '#22263a',
              border: `1px solid ${platform === p ? '#e84040' : '#2e3350'}`,
              color: platform === p ? '#ff6b6b' : '#8b90a7',
            }}
          >
            {p}
          </span>
        ))}
        <span
          onClick={() => handlePlatform('')}
          className="px-3 py-1 rounded-[20px] text-xs cursor-pointer transition-all duration-200"
          style={{
            background: platform === '' ? 'rgba(232,64,64,0.08)' : '#22263a',
            border: `1px solid ${platform === '' ? '#e84040' : '#2e3350'}`,
            color: platform === '' ? '#ff6b6b' : '#8b90a7',
          }}
        >
          全部平台
        </span>
      </div>

      {/* 区域标题 - 红色竖条 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-[18px] rounded-[2px]" style={{ background: '#e84040' }} />
          <span className="text-sm font-bold" style={{ color: '#e8eaf0' }}>黑名单记录</span>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={risk}
            onChange={e => { setRisk(e.target.value); onSearch(query, type, e.target.value, platform, sort); }}
            className="px-2.5 py-1.5 rounded-md text-xs outline-none cursor-pointer"
            style={{ background: '#1a1d27', border: '1px solid #2e3350', color: '#8b90a7' }}
          >
            <option value="">全部风险</option>
            <option value="高">高风险</option>
            <option value="中">中风险</option>
            <option value="低">低风险</option>
          </select>
          <select
            value={sort}
            onChange={e => { setSort(e.target.value); onSearch(query, type, risk, platform, e.target.value); }}
            className="px-2.5 py-1.5 rounded-md text-xs outline-none cursor-pointer"
            style={{ background: '#1a1d27', border: '1px solid #2e3350', color: '#8b90a7' }}
          >
            <option value="created_at">最新优先</option>
            <option value="report_count">举报最多</option>
          </select>
        </div>
      </div>
    </div>
  )
}
