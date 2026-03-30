'use client'

import { useState } from 'react'

interface SearchFormProps {
  onSearch: (query: string, risk: string, platform: string, sort: string, field: string) => void
}

export function SearchForm({ onSearch }: SearchFormProps) {
  const [query, setQuery] = useState('')
  const [risk, setRisk] = useState('')
  const [platform, setPlatform] = useState('')
  const [sort, setSort] = useState('created_at')
  const [field, setField] = useState('')

  const handleSearch = () => {
    onSearch(query, risk, platform, sort, field)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const platforms = ['Amazon', 'eBay', 'Shopify', 'AliExpress', 'Wish', 'Alibaba']

  return (
    <div className="mb-8">
      {/* 搜索栏 */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex-1 flex gap-2">
          <select
            value={field}
            onChange={(e) => { setField(e.target.value); onSearch(query, risk, platform, sort, e.target.value); }}
            className="px-4 py-3 bg-[#1a1d27] border border-gray-700 rounded-lg text-gray-300 text-sm focus:outline-none"
          >
            <option value="">全部字段</option>
            <option value="name">买家姓名</option>
            <option value="platform">平台 / ID</option>
            <option value="email">邮箱地址</option>
            <option value="phone">电话号码</option>
            <option value="address">收货地址</option>
          </select>
          <input
            placeholder="输入买家姓名、邮箱、电话或地址进行查询..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-3 bg-[#1a1d27] border border-gray-700 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-red-500/50 transition"
          />
          <button 
            onClick={handleSearch}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center gap-2 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            查询
          </button>
        </div>
      </div>

      {/* 平台标签 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {platforms.map((p) => (
          <button
            key={p}
            onClick={() => { setPlatform(p); onSearch(query, risk, p, sort, field); }}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition
              ${platform === p
                ? 'bg-red-500 text-white'
                : 'bg-[#1a1d27] border border-gray-700 text-gray-300 hover:border-gray-600'
              }
            `}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => { setPlatform(''); onSearch(query, risk, '', sort, field); }}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition
            ${platform === ''
              ? 'bg-red-500 text-white'
              : 'bg-[#1a1d27] border border-gray-700 text-gray-300 hover:border-gray-600'
            }
          `}
        >
          全部平台
        </button>
      </div>

      {/* 筛选器 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-red-500 rounded-full" />
          <span className="text-white font-medium">黑名单记录</span>
        </div>
        <div className="flex gap-2">
          <select
            value={risk}
            onChange={(e) => { setRisk(e.target.value); onSearch(query, e.target.value, platform, sort, field); }}
            className="px-4 py-2 bg-[#1a1d27] border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none"
          >
            <option value="">全部风险</option>
            <option value="高">高风险</option>
            <option value="中">中风险</option>
            <option value="低">低风险</option>
          </select>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); onSearch(query, risk, platform, e.target.value, field); }}
            className="px-4 py-2 bg-[#1a1d27] border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none"
          >
            <option value="created_at">最新优先</option>
            <option value="report_count">举报最多</option>
          </select>
        </div>
      </div>
    </div>
  )
}
