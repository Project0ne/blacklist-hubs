'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { BlacklistItem, Stats, MergedBlacklistItem } from '@/types'
import { StatsCards } from '@/components/stats-cards'
import { SearchForm } from '@/components/search-form'
import { BlacklistTable } from '@/components/blacklist-table'
import { ReportFormDialog } from '@/components/report-form'
import { DetailModal } from '@/components/detail-modal'

function mergeByBuyerGroup(items: BlacklistItem[]): MergedBlacklistItem[] {
  // Union-Find: 邮箱或电话任一匹配就合并，支持传递
  const parent = new Map<number, number>()
  const find = (i: number): number => {
    if (parent.get(i) !== i) parent.set(i, find(parent.get(i)!))
    return parent.get(i)!
  }
  const union = (a: number, b: number) => {
    const ra = find(a), rb = find(b)
    if (ra !== rb) parent.set(ra, rb)
  }

  // 初始化每个 item 的 parent 为自身索引
  items.forEach((_, i) => parent.set(i, i))

  // 地址标准化：转小写、去标点符号、压缩空格
  const normalizeAddr = (addr: string) =>
    addr.toLowerCase().replace(/[.,#\-'/]/g, ' ').replace(/\s+/g, ' ').trim()

  // 按邮箱、电话、收货地址建立索引，匹配到同一个值的记录合并
  const emailMap = new Map<string, number>()
  const phoneMap = new Map<string, number>()
  const addrMap = new Map<string, number>()
  items.forEach((item, i) => {
    const email = item.email?.trim().toLowerCase()
    if (email) {
      if (emailMap.has(email)) union(i, emailMap.get(email)!)
      else emailMap.set(email, i)
    }
    const phone = item.phone?.trim()
    if (phone) {
      if (phoneMap.has(phone)) union(i, phoneMap.get(phone)!)
      else phoneMap.set(phone, i)
    }
    const addr = item.address?.trim()
    if (addr) {
      const norm = normalizeAddr(addr)
      if (norm.length > 5) { // 太短的地址不作为匹配依据，避免误合并
        if (addrMap.has(norm)) union(i, addrMap.get(norm)!)
        else addrMap.set(norm, i)
      }
    }
  })

  // 按根节点分组
  const groups: Record<number, BlacklistItem[]> = {}
  items.forEach((item, i) => {
    const root = find(i)
    if (!groups[root]) groups[root] = []
    groups[root].push(item)
  })

  return Object.entries(groups).map(([gid, records]) => {
    records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const latest = records[0]

    const uniqueFilter = <T,>(arr: (T | undefined | null)[]): T[] =>
      Array.from(new Set(arr.filter((v): v is T => v != null && v !== '')))

    return {
      id: latest.id,
      name: latest.name,
      buyer_group_id: gid,
      platforms: uniqueFilter(records.map(r => r.platform)),
      platform_ids: uniqueFilter(records.map(r => r.platform_id)),
      emails: uniqueFilter(records.map(r => r.email)),
      phones: uniqueFilter(records.map(r => r.phone)),
      addresses: uniqueFilter(records.map(r => r.address)),
      risk: records.some(r => r.risk === '高') ? '高' : records.some(r => r.risk === '中') ? '中' : '低',
      dispute_types: uniqueFilter(records.map(r => r.dispute_type)),
      refund_total: records.reduce((sum, r) => sum + (r.refund_amount || 0), 0),
      report_count: records.length,
      evidence_images: records.flatMap(r => r.evidence_images || []),
      created_at: latest.created_at,
      status: latest.status,
      records,
    }
  })
}

export default function HomePage() {
  const [allItems, setAllItems] = useState<BlacklistItem[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, highRisk: 0, pending: 0, todayNew: 0 })
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [selectedMergedItem, setSelectedMergedItem] = useState<MergedBlacklistItem | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [dbStatus, setDbStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  const PAGE_SIZE = 10

  const checkConnection = async () => {
    try {
      const { error } = await supabase.from('blacklist').select('id', { count: 'exact', head: true })
      if (error) throw error
      setDbStatus('connected')
    } catch {
      setDbStatus('disconnected')
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('blacklist')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (riskFilter) query = query.eq('risk', riskFilter)
      if (platformFilter) query = query.eq('platform', platformFilter)
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query
      if (error) throw error

      setAllItems(data || [])
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 合并 + 客户端分页
  const mergedItems = useMemo(() => mergeByBuyerGroup(allItems), [allItems])

  const sortedMerged = useMemo(() => {
    const arr = [...mergedItems]
    if (sortBy === 'report_count') {
      arr.sort((a, b) => b.report_count - a.report_count)
    } else if (sortBy === 'risk') {
      const riskOrder: Record<string, number> = { '高': 3, '中': 2, '低': 1 }
      arr.sort((a, b) => (riskOrder[b.risk] || 0) - (riskOrder[a.risk] || 0))
    }
    // default: already sorted by created_at
    return arr
  }, [mergedItems, sortBy])

  const totalPages = Math.ceil(sortedMerged.length / PAGE_SIZE)
  const totalRows = sortedMerged.length
  const pagedItems = useMemo(() => {
    const from = (currentPage - 1) * PAGE_SIZE
    return sortedMerged.slice(from, from + PAGE_SIZE)
  }, [sortedMerged, currentPage])

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
    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (dbStatus === 'connected') {
      loadData()
      loadStats()
    }
  }, [dbStatus, searchQuery, riskFilter, platformFilter, sortBy])

  // 当筛选变化时重置页码
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, riskFilter, platformFilter, sortBy])

  const handleSearch = (query: string, risk: string, platform: string, sort: string) => {
    setSearchQuery(query)
    setRiskFilter(risk)
    setPlatformFilter(platform)
    setSortBy(sort)
  }

  const handleViewDetail = (item: MergedBlacklistItem) => {
    setSelectedMergedItem(item)
    setShowDetailModal(true)
  }

  const handleSupplementReport = () => {
    setShowReportModal(true)
  }

  return (
    <div className="min-h-screen bg-[#0a0c14] relative overflow-hidden">
      {/* 赛博朋克光晕层 */}
      <div
        className="pointer-events-none absolute top-0 left-0 w-full h-[700px] z-[1]"
        style={{
          background: 'radial-gradient(ellipse 90% 45% at 50% -5%, rgba(220,38,38,0.22) 0%, rgba(180,30,30,0.08) 45%, transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute top-0 left-[-15%] w-[65%] h-[600px] z-[1]"
        style={{
          background: 'radial-gradient(ellipse 60% 55% at 25% -5%, rgba(255,60,20,0.14) 0%, transparent 65%)',
        }}
      />
      <div
        className="pointer-events-none absolute top-0 right-[-10%] w-[50%] h-[400px] z-[1]"
        style={{
          background: 'radial-gradient(ellipse 50% 50% at 70% 0%, rgba(200,40,80,0.08) 0%, transparent 60%)',
        }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-40 backdrop-blur-md"
        style={{
          background: 'rgba(10,12,20,0.6)',
          borderBottom: '1px solid rgba(220,38,38,0.15)',
          boxShadow: '0 1px 20px rgba(220,38,38,0.06), inset 0 -1px 0 rgba(220,38,38,0.1)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                boxShadow: '0 0 20px rgba(220,38,38,0.4), 0 0 6px rgba(220,38,38,0.2)',
              }}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">
              <span className="text-white">外贸</span>
              <span style={{ color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,0.4)' }}>黑名单</span>
              <span className="text-gray-300">预警平台</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              dbStatus === 'connected' ? 'bg-green-500/10 border-green-500/30' :
              dbStatus === 'disconnected' ? 'bg-red-500/10 border-red-500/30' :
              'bg-yellow-500/10 border-yellow-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                dbStatus === 'connected' ? 'bg-green-400' :
                dbStatus === 'disconnected' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
              }`} />
              <span className={`text-xs ${
                dbStatus === 'connected' ? 'text-green-400' :
                dbStatus === 'disconnected' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {dbStatus === 'connected' ? '已连接' :
                 dbStatus === 'disconnected' ? '已断开' : '连接中...'}
              </span>
            </div>
            <a href="/admin" className="px-4 py-2 text-sm text-gray-400 bg-gray-800/50 border border-gray-700 rounded-lg hover:text-white hover:border-gray-600 transition">
              管理后台
            </a>
            <ReportFormDialog
              externalOpen={showReportModal}
              onOpenChange={setShowReportModal}
              onSuccess={() => { loadData(); loadStats(); }}
              supplementItem={selectedMergedItem?.records[0] || null}
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="text-white">外贸买家</span>
          <span className="mx-2" style={{ color: '#ef4444', textShadow: '0 0 30px rgba(239,68,68,0.5), 0 0 60px rgba(239,68,68,0.2)' }}>风险预警</span>
          <span className="text-white">数据库</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          收录恶意仅退款、虚假纠纷、空包诈骗等高风险买家信息，保护外贸卖家合法权益
        </p>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-16 relative z-10">
        <StatsCards stats={stats} />
        <SearchForm onSearch={handleSearch} />
        <BlacklistTable
          items={pagedItems}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalRows={totalRows}
          onPageChange={setCurrentPage}
          onViewDetail={handleViewDetail}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>外贸黑名单预警平台 · 保护外贸卖家合法权益</p>
          <p className="mt-1">数据由社区共同维护，仅供参考</p>
        </div>
      </footer>

      {/* 详情模态框 */}
      {selectedMergedItem && (
        <DetailModal
          item={selectedMergedItem}
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onReport={handleSupplementReport}
        />
      )}
    </div>
  )
}
