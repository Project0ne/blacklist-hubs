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
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 sticky top-0 bg-gray-950/80 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-xl">
              🚫
            </div>
            <div>
              <h1 className="text-xl font-bold">外贸<span className="text-red-400">黑名单</span>预警平台</h1>
              <p className="text-xs text-gray-500">保护外贸卖家合法权益</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/admin" className="text-sm text-gray-400 hover:text-gray-200 transition">
              管理后台
            </a>
            <ReportFormDialog onSuccess={() => { loadData(); loadStats(); }} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <StatsCards stats={stats} />
        <SearchForm onSearch={handleSearch} />
        <BlacklistTable
          items={items}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </main>

      <footer className="border-t border-gray-800 py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>外贸黑名单预警平台 · 保护外贸卖家合法权益</p>
          <p className="mt-1">数据由社区共同维护，仅供参考</p>
        </div>
      </footer>
    </div>
  )
}
