'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ReportModal } from '@/components/report-modal'
import { DetailModal } from '@/components/detail-modal'
import { HowModal } from '@/components/how-modal'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const sb = createClient(supabaseUrl, supabaseKey)

interface BlacklistItem {
  id: number
  name: string
  platform?: string
  platform_id?: string
  email: string
  phone?: string
  address?: string
  risk: '高' | '中' | '低'
  dispute_type?: string
  description?: string
  report_count: number
  related_emails?: string[]
  created_at: string
  status: string
}

const DEMO: BlacklistItem[] = [
  { id: 1, name: "John Miller", platform: "Amazon", platform_id: "jmiller_99", email: "jmiller99@gmail.com", phone: "+1-213-555-0197", address: "8420 Sunset Blvd, Los Angeles, CA 90028, USA", risk: "高", report_count: 7, dispute_type: "仅退款", created_at: "2026-03-25", description: "多次购买后仅退款，累计7次，拒绝退货。平台介入后仍胜诉，疑似与平台客服有特殊渠道。", related_emails: ["jmiller_sale@hotmail.com"], status: "approved" },
  { id: 2, name: "Sarah L.", platform: "eBay", platform_id: "sarah_bargain", email: "sarah.l.deals@yahoo.com", phone: "+44-7700-900123", address: "14 Oxford Street, London, W1D 1AR, UK", risk: "高", report_count: 5, dispute_type: "虚假未收到", created_at: "2026-03-22", description: "声称包裹未到，要求退款后转卖同款商品。物流显示已签收。", related_emails: [], status: "approved" },
  { id: 3, name: "Carlos Mendez", platform: "Shopify", platform_id: "", email: "carlos.m@outlook.com", phone: "+52-55-1234-5678", address: "Av. Insurgentes Sur 1234, Mexico City, Mexico", risk: "中", report_count: 2, dispute_type: "信用卡拒付", created_at: "2026-03-20", description: "下单后30天发起信用卡拒付，金额$280，两次均成功。", related_emails: [], status: "approved" },
  { id: 4, name: "Emily Watson", platform: "AliExpress", platform_id: "emily_w_2023", email: "emily.watson.buy@gmail.com", phone: "+61-412-345-678", address: "22 George St, Sydney NSW 2000, Australia", risk: "高", report_count: 9, dispute_type: "恶意差评", created_at: "2026-03-19", description: "收货后给1星差评，私信要求补$50礼品卡否则不改评。多个卖家反馈相同。", related_emails: ["emily.w.refund@gmail.com"], status: "approved" },
  { id: 5, name: "Mike Johnson", platform: "eBay", platform_id: "mj_collector", email: "mike.j.collector@hotmail.com", phone: "+1-312-555-0789", address: "233 N Michigan Ave, Chicago, IL 60601, USA", risk: "高", report_count: 11, dispute_type: "仅退款", created_at: "2026-03-14", description: "职业骗子，在多个卖家处操作相同手法：下单、声称未收到、仅退款。已有多家卖家联合举报。", related_emails: ["mike.johnson.refund@gmail.com"], status: "approved" },
  { id: 6, name: "Robert Schmidt", platform: "Amazon", platform_id: "r_schmidt_de", email: "r.schmidt@gmx.de", phone: "+49-176-1234-5678", address: "Alexanderplatz 5, 10178 Berlin, Germany", risk: "高", report_count: 8, dispute_type: "信用卡拒付", created_at: "2026-03-01", description: "欧洲职业拒付用户，通过信用卡公司争议方式多次成功骗取货款。", related_emails: [], status: "approved" },
]

export default function HomePage() {
  const [demoMode, setDemoMode] = useState(false)
  const [items, setItems] = useState<BlacklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRows, setTotalRows] = useState(0)
  const [activePlatform, setActivePlatform] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState('all')
  const [riskFilter, setRiskFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'connecting'>('connecting')
  
  const [showReportModal, setShowReportModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showHowModal, setShowHowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<BlacklistItem | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const PAGE_SIZE = 10

  // Check DB connection
  useEffect(() => {
    checkConnection()
  }, [])

  async function checkConnection() {
    try {
      const { error } = await sb.from('blacklist').select('id', { count: 'exact', head: true })
      if (error) throw error
      setDbStatus('online')
      loadData()
    } catch {
      setDbStatus('offline')
      setDemoMode(true)
      loadDemoData()
    }
  }

  function loadDemoData() {
    let data = [...DEMO]
    if (activePlatform) data = data.filter(r => r.platform === activePlatform)
    if (riskFilter) data = data.filter(r => r.risk === riskFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      data = data.filter(r => {
        if (searchType === 'name') return r.name.toLowerCase().includes(q)
        if (searchType === 'email') return r.email.toLowerCase().includes(q)
        if (searchType === 'phone') return r.phone?.toLowerCase().includes(q)
        if (searchType === 'address') return r.address?.toLowerCase().includes(q)
        return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.phone?.toLowerCase().includes(q) || r.address?.toLowerCase().includes(q)
      })
    }
    if (sortBy === 'report_count') data.sort((a, b) => b.report_count - a.report_count)
    else data.sort((a, b) => b.created_at.localeCompare(a.created_at))
    
    setTotalRows(data.length)
    const start = (currentPage - 1) * PAGE_SIZE
    setItems(data.slice(start, start + PAGE_SIZE))
    setLoading(false)
  }

  async function loadData() {
    if (demoMode) { loadDemoData(); return }
    setLoading(true)
    
    const from = (currentPage - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = sb.from('blacklist')
      .select('*', { count: 'exact' })
      .eq('status', 'approved')
      .range(from, to)
      .order(sortBy, { ascending: false })

    if (activePlatform) query = query.eq('platform', activePlatform)
    if (riskFilter) query = query.eq('risk', riskFilter)
    if (searchQuery) {
      const q = searchQuery
      if (searchType === 'name') query = query.ilike('name', `%${q}%`)
      else if (searchType === 'email') query = query.ilike('email', `%${q}%`)
      else if (searchType === 'phone') query = query.ilike('phone', `%${q}%`)
      else if (searchType === 'address') query = query.ilike('address', `%${q}%`)
      else query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,address.ilike.%${q}%`)
    }

    const { data, count, error } = await query
    if (error) {
      showToast('数据加载失败：' + error.message, 'error')
      setLoading(false)
      return
    }
    setItems(data || [])
    setTotalPages(count || 0)
    setLoading(false)
  }

  useEffect(() => {
    if (dbStatus !== 'connecting') loadData()
  }, [currentPage, activePlatform, riskFilter, sortBy, searchQuery, searchType, demoMode])

  const totalPages = Math.ceil(totalRows / PAGE_SIZE)

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  function handleSearch() {
    setCurrentPage(1)
    loadData()
  }

  function handleFilterPlatform(platform: string) {
    setActivePlatform(platform)
    setCurrentPage(1)
  }

  function openDetail(item: BlacklistItem) {
    setSelectedItem(item)
    setShowDetailModal(true)
  }

  function maskEmail(email?: string) {
    if (!email) return '-'
    const [u, d] = email.split('@')
    return u.slice(0, 2) + '***@' + d
  }

  function maskPhone(phone?: string) {
    if (!phone) return '-'
    return phone.slice(0, 6) + '****' + phone.slice(-2)
  }

  function maskAddress(address?: string) {
    if (!address) return '-'
    return address.slice(0, 12) + '***'
  }

  function fmtDate(d?: string) {
    if (!d) return '-'
    return d.slice ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)
  }

  function platformClass(p?: string) {
    return { Amazon: 'platform-amazon', eBay: 'platform-ebay', Shopify: 'platform-shopify', AliExpress: 'platform-aliexpress', Wish: 'platform-wish' }[p || ''] || ''
  }

  function riskClass(r: string) {
    return { '高': 'risk-high', '中': 'risk-mid', '低': 'risk-low' }[r] || 'risk-low'
  }

  function riskLabel(r: string) {
    return { '高': '🔴 高风险', '中': '🔶 中风险', '低': '⚠️ 低风险' }[r] || r
  }

  function countClass(n: number) {
    return n >= 5 ? 'count-hot' : n >= 3 ? 'count-mid' : 'count-low'
  }

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <a className="logo" href="#">
            <div className="logo-icon">🚫</div>
            <div className="logo-text">外贸<span>黑名单</span>预警平台</div>
          </a>
          <div className="header-nav">
            <span className={`db-status ${dbStatus === 'online' ? 'online' : 'offline'}`}>
              <span className="db-dot" />
              {dbStatus === 'connecting' ? '连接中...' : dbStatus === 'online' ? '数据库已连接' : '演示模式'}
            </span>
            <button className="nav-btn" onClick={() => setShowHowModal(true)}>使用说明</button>
            <button className="nav-btn primary" onClick={() => setShowReportModal(true)}>＋ 提交举报</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <h1>外贸买家 <span>风险预警</span> 数据库</h1>
        <p>收录恶意仅退款、虚假纠纷、空包诈骗等高风险买家信息，保护外贸卖家合法权益</p>
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-num">{demoMode ? DEMO.length : totalRows || '—'}</div>
            <div className="stat-label">黑名单总数</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{demoMode ? DEMO.filter(r => r.risk === '高').length : '—'}</div>
            <div className="stat-label">高风险买家</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">—</div>
            <div className="stat-label">待审核举报</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">0</div>
            <div className="stat-label">今日新增</div>
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="main">
        {/* Search */}
        <div className="search-section">
          <div className="search-box">
            <select className="search-select" value={searchType} onChange={(e) => setSearchType(e.target.value)}>
              <option value="all">全部字段</option>
              <option value="name">买家姓名</option>
              <option value="email">邮箱地址</option>
              <option value="phone">电话号码</option>
              <option value="address">收货地址</option>
              <option value="platform_id">平台 ID</option>
            </select>
            <input
              className="search-input"
              placeholder="输入买家姓名、邮箱、电话或地址进行查询..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="search-btn" onClick={handleSearch}>🔍 查询</button>
          </div>
          <div className="search-tags">
            {['Amazon', 'eBay', 'Shopify', 'AliExpress', 'Wish'].map(p => (
              <span
                key={p}
                className={`search-tag ${activePlatform === p ? 'active' : ''}`}
                onClick={() => handleFilterPlatform(p)}
              >
                {p}
              </span>
            ))}
            <span
              className={`search-tag ${activePlatform === '' ? 'active' : ''}`}
              onClick={() => handleFilterPlatform('')}
            >
              全部平台
            </span>
          </div>
        </div>

        {/* Section Header */}
        <div className="section-header">
          <div className="section-title">黑名单记录</div>
          <div className="filter-row">
            <select className="filter-select" value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">全部风险</option>
              <option value="高">高风险</option>
              <option value="中">中风险</option>
              <option value="低">低风险</option>
            </select>
            <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="created_at">最新优先</option>
              <option value="report_count">举报最多</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th><th>买家姓名</th><th>平台 / ID</th>
                <th>邮箱地址</th><th>电话号码</th><th>收货地址</th>
                <th>风险等级</th><th>举报次数</th><th>最近时间</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(10)].map((_, j) => (
                      <td key={j}><div className="skeleton-bar" style={{ width: '80%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? null : (
                items.map((row, i) => (
                  <tr key={row.id}>
                    <td style={{ color: 'var(--text2)', fontSize: '12px' }}>{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                    <td>
                      <strong>{row.name}</strong>
                      <br />
                      <span style={{ fontSize: '11px', color: 'var(--text2)' }}>{row.dispute_type || ''}</span>
                    </td>
                    <td>
                      <span className={`platform-tag ${platformClass(row.platform)}`}>{row.platform || '—'}</span>
                      {row.platform_id && (
                        <br />
                      )}
                      {row.platform_id && <span style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px', display: 'block' }}>{row.platform_id}</span>}
                    </td>
                    <td><span className="masked" onClick={() => openDetail(row)}>{maskEmail(row.email)}</span></td>
                    <td><span className="masked" onClick={() => openDetail(row)}>{maskPhone(row.phone)}</span></td>
                    <td style={{ maxWidth: '160px' }}><span className="masked" onClick={() => openDetail(row)}>{maskAddress(row.address)}</span></td>
                    <td><span className={`risk-badge ${riskClass(row.risk)}`}>{riskLabel(row.risk)}</span></td>
                    <td><span className={`report-count ${countClass(row.report_count || 1)}`}>{row.report_count || 1}</span></td>
                    <td style={{ color: 'var(--text2)', fontSize: '12px' }}>{fmtDate(row.created_at)}</td>
                    <td><button className="detail-btn" onClick={() => openDetail(row)}>详情</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {items.length === 0 && !loading && (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <strong>未找到相关记录</strong>
              <p>尝试其他关键词，或 <a href="#" onClick={(e) => { e.preventDefault(); setShowReportModal(true) }} style={{ color: 'var(--accent2)' }}>提交新的举报</a></p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ‹
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="page-btn"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                ›
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <ReportModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        demoMode={demoMode}
        onSuccess={() => { loadData(); showToast('举报已提交，等待管理员审核！', 'success') }}
        showToast={showToast}
      />

      <DetailModal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        item={selectedItem}
        onReport={() => { setShowDetailModal(false); setShowReportModal(true) }}
      />

      <HowModal open={showHowModal} onClose={() => setShowHowModal(false)} />

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type} show`}>
          <span className="toast-icon">{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </>
  )
}
