'use client'

import { useState } from 'react'

interface SearchFormProps {
  onSearch: (query: string, risk: string, platform: string, sort: string) => void
}

export function SearchForm({ onSearch }: SearchFormProps) {
  const [query, setQuery] = useState('')
  const [risk, setRisk] = useState('')
  const [platform, setPlatform] = useState('')
  const [sort, setSort] = useState('created_at')

  const handleSearch = () => {
    onSearch(query, risk, platform, sort)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const platforms = ['Amazon', 'eBay', 'Shopify', 'AliExpress', 'Wish']

  return (
    <div className="mb-8">
      {/* 搜索栏 */}
      <div className="industrial-panel p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 主搜索框 */}
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              placeholder="SEARCH BY NAME, EMAIL, PHONE OR ADDRESS..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-12 pr-4 py-3 bg-surface-900 border-2 border-surface-700 rounded-lg text-surface-100 placeholder:text-surface-600 font-mono text-sm uppercase tracking-wider focus:outline-none focus:border-hazard-500/50 transition-all"
            />
          </div>
          
          {/* 搜索按钮 */}
          <button 
            onClick={handleSearch}
            className="btn-industrial btn-industrial-primary flex items-center gap-2 px-8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            SEARCH
          </button>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 风险等级 */}
        <select
          value={risk}
          onChange={(e) => { setRisk(e.target.value); onSearch(query, e.target.value, platform, sort); }}
          className="px-4 py-2 bg-surface-900 border border-surface-700 rounded-lg text-sm text-surface-300 focus:outline-none focus:border-surface-600 transition-all appearance-none cursor-pointer"
        >
          <option value="">ALL RISK LEVELS</option>
          <option value="高">🔴 HIGH RISK</option>
          <option value="中">🟡 MEDIUM RISK</option>
          <option value="低">🟢 LOW RISK</option>
        </select>

        {/* 排序 */}
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); onSearch(query, risk, platform, e.target.value); }}
          className="px-4 py-2 bg-surface-900 border border-surface-700 rounded-lg text-sm text-surface-300 focus:outline-none focus:border-surface-600 transition-all appearance-none cursor-pointer"
        >
          <option value="created_at">NEWEST FIRST</option>
          <option value="report_count">MOST REPORTED</option>
        </select>

        <div className="flex-1" />

        {/* 平台标签 */}
        <div className="flex flex-wrap gap-2">
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => { setPlatform(p); onSearch(query, risk, p, sort); }}
              className={`
                px-4 py-1.5 rounded-lg text-xs font-mono font-medium uppercase tracking-wider
                transition-all duration-200
                ${platform === p
                  ? 'bg-hazard-500 text-surface-950 shadow-lg shadow-hazard-500/20'
                  : 'bg-surface-800 text-surface-400 border border-surface-700 hover:border-surface-600 hover:text-surface-300'
                }
              `}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => { setPlatform(''); onSearch(query, risk, '', sort); }}
            className={`
              px-4 py-1.5 rounded-lg text-xs font-mono font-medium uppercase tracking-wider
              transition-all duration-200
              ${platform === ''
                ? 'bg-surface-600 text-surface-100'
                : 'bg-surface-800 text-surface-400 border border-surface-700 hover:border-surface-600 hover:text-surface-300'
              }
            `}
          >
            ALL
          </button>
        </div>
      </div>
    </div>
  )
}
