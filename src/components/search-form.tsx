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
    <div className="mb-6">
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex-1 flex gap-2">
          <input
            placeholder="输入买家姓名、邮箱、电话或地址进行查询..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-md px-4 py-2 text-gray-100 outline-none focus:border-red-500"
          />
          <button onClick={handleSearch} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-medium transition">
            🔍 查询
          </button>
        </div>
        <div className="flex gap-2">
          <select
            value={risk}
            onChange={(e) => { setRisk(e.target.value); onSearch(query, e.target.value, platform, sort); }}
            className="w-[120px] bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-gray-300 outline-none"
          >
            <option value="">全部风险</option>
            <option value="高">高风险</option>
            <option value="中">中风险</option>
            <option value="低">低风险</option>
          </select>
          <select
            value={platform}
            onChange={(e) => { setPlatform(e.target.value); onSearch(query, risk, e.target.value, sort); }}
            className="w-[120px] bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-gray-300 outline-none"
          >
            <option value="">全部平台</option>
            {platforms.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); onSearch(query, risk, platform, e.target.value); }}
            className="w-[120px] bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-gray-300 outline-none"
          >
            <option value="created_at">最新优先</option>
            <option value="report_count">举报最多</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {platforms.map((p) => (
          <button
            key={p}
            onClick={() => { setPlatform(p); onSearch(query, risk, p, sort); }}
            className={`px-4 py-1 rounded-full text-sm transition ${
              platform === p
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-red-500'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => { setPlatform(''); onSearch(query, risk, '', sort); }}
          className={`px-4 py-1 rounded-full text-sm transition ${
            platform === ''
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-red-500'
          }`}
        >
          全部平台
        </button>
      </div>
    </div>
  )
}
