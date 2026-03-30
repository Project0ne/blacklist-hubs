'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BlacklistItem, Stats } from '@/types'
import { StatsCards } from '@/components/stats-cards'
import { SearchForm } from '@/components/search-form'
import { BlacklistTable } from '@/components/blacklist-table'
import { ReportFormDialog } from '@/components/report-form'

export default function HomePage() {
  const [items, setItems] = useState<BlacklistItem[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, highRisk: 0, pending: 0, todayNew: 0 })
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRows, setTotalRows] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')

  const PAGE_SIZE = 10

  const loadData = async () => {
    setLoading(true)
    try {
      const from = (currentPage - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase
        .from('blacklist')
        .select('*', { count: 'exact' })
        .eq('status', 'approved')
        .order(sortBy, { ascending: false })
        .range(from, to)

      if (riskFilter) query = query.eq('risk', riskFilter)
      if (platformFilter) query = query.eq('platform', platformFilter)
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
      }

      const { data, count, error } = await query
      if (error) throw error

      setItems(data || [])
      setTotalPages(Math.ceil((count || 0) / PAGE_SIZE))
      setTotalRows(count || 0)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const [totalRes, highRes, pendingRes, todayRes] = await Promise.all([
        supabase.from('blacklist').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('blacklist').select('id', { count: 'exact', head: true }).eq('status', 'approved').eq('risk', '高'),
        supabase.from('blacklist').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('blacklist').select('id', { count: 'exact', head: true }).eq('status', 'approved').gte('created_at', today),
      ])

      setStats({
        total: totalRes.count || 0,
        highRisk: highRes.count || 0,
        pending: pendingRes.count || 0,
        todayNew: todayRes.count || 0,
      })
    } catch (error) {
      console.error('加载统计失败:', error)
    }
  }

  useEffect(() => {
    loadData()
    loadStats()
  }, [currentPage, searchQuery, riskFilter, platformFilter, sortBy])

  const handleSearch = (query: string, risk: string, platform: string, sort: string) => {
    setSearchQuery(query)
    setRiskFilter(risk)
    setPlatformFilter(platform)
    setSortBy(sort)
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-[#0f1117]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">
              <span className="text-white">外贸</span>
              <span className="text-red-500">黑名单</span>
              <span className="text-gray-300">预警平台</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm text-yellow-500 bg-yellow-500/10 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition">
              演示模式
            </button>
            <a href="/admin" className="px-4 py-2 text-sm text-gray-400 bg-gray-800/50 border border-gray-700 rounded-lg hover:text-white hover:border-gray-600 transition">
              管理后台
            </a>
            <ReportFormDialog onSuccess={() => { loadData(); loadStats(); }} />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="text-white">外贸买家</span>
          <span className="text-red-500 mx-2">风险预警</span>
          <span className="text-white">数据库</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          收录恶意仅退款、虚假纠纷、空包诈骗等高风险买家信息，保护外贸卖家合法权益
        </p>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-16">
        <StatsCards stats={stats} />
        <SearchForm onSearch={handleSearch} />
        <BlacklistTable
          items={items}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalRows={totalRows}
          onPageChange={setCurrentPage}
          onViewDetail={() => {}}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>外贸黑名单预警平台 · 保护外贸卖家合法权益</p>
          <p className="mt-1">数据由社区共同维护，仅供参考</p>
        </div>
      </footer>
    </div>
  )
}
