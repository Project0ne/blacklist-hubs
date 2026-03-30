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
    <div className="min-h-screen">
      {/* 顶部警告条 */}
      <div className="h-1.5 bg-gradient-to-r from-hazard-500 via-danger-500 to-hazard-500" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-surface-800 bg-surface-950/95 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-danger-600 to-danger-700 rounded-lg flex items-center justify-center shadow-lg shadow-danger-500/20">
                  <span className="text-2xl">🚫</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-hazard-500 rounded-full animate-pulse border-2 border-surface-950" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  <span className="text-hazard-400">BLACK</span>
                  <span className="text-surface-100">LIST</span>
                  <span className="text-surface-500 font-normal ml-2 text-lg">HUB</span>
                </h1>
                <p className="text-xs font-mono text-surface-500 tracking-wider">CROSS-BORDER E-COMMERCE RISK DATABASE</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <a 
                href="/admin" 
                className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-900 border border-surface-700 text-surface-400 hover:text-surface-200 hover:border-surface-600 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium">ADMIN</span>
              </a>
              <ReportFormDialog onSuccess={() => { loadData(); loadStats(); }} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
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

      {/* Footer */}
      <footer className="border-t border-surface-800 mt-12">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-surface-800 rounded flex items-center justify-center">
                <span className="text-lg">🚫</span>
              </div>
              <span className="font-bold text-surface-300">BlackList Hub</span>
            </div>
            <p className="text-sm text-surface-500 font-mono">
              DATA MAINTAINED BY COMMUNITY · FOR REFERENCE ONLY
            </p>
            <div className="flex items-center gap-2 text-xs text-surface-600">
              <span className="status-dot status-dot-active" />
              <span>SYSTEM ONLINE</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
