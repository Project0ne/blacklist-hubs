'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { BlacklistItem, Stats } from '@/types'
import { SearchForm } from '@/components/search-form'
import { BlacklistTable } from '@/components/blacklist-table'
import { ReportFormDialog } from '@/components/report-form'
import { DetailModal } from '@/components/detail-modal'

export default function HomePage() {
  const [items, setItems] = useState<BlacklistItem[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, highRisk: 0, pending: 0, todayNew: 0 })
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRows, setTotalRows] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState('all')
  const [riskFilter, setRiskFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [dbStatus, setDbStatus] = useState<'online' | 'offline'>('offline')
  const [selectedItem, setSelectedItem] = useState<BlacklistItem | null>(null)
  const [showHowModal, setShowHowModal] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const PAGE_SIZE = 10

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const loadData = useCallback(async () => {
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
        if (searchType === 'name') query = query.ilike('name', `%${searchQuery}%`)
        else if (searchType === 'email') query = query.ilike('email', `%${searchQuery}%`)
        else if (searchType === 'phone') query = query.ilike('phone', `%${searchQuery}%`)
        else if (searchType === 'address') query = query.ilike('address', `%${searchQuery}%`)
        else if (searchType === 'platform_id') query = query.ilike('platform_id', `%${searchQuery}%`)
        else query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
      }

      const { data, count, error } = await query
      if (error) throw error

      setItems(data || [])
      setTotalRows(count || 0)
      setTotalPages(Math.ceil((count || 0) / PAGE_SIZE))
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, searchType, riskFilter, platformFilter, sortBy])

  const loadStats = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('blacklist').select('id', { count: 'exact', head: true })
        if (error) throw error
        setDbStatus('online')
      } catch {
        setDbStatus('offline')
      }
    }
    checkConnection()
  }, [])

  useEffect(() => {
    loadData()
    loadStats()
  }, [loadData, loadStats])

  const handleSearch = (query: string, type: string, risk: string, platform: string, sort: string) => {
    setSearchQuery(query)
    setSearchType(type)
    setRiskFilter(risk)
    setPlatformFilter(platform)
    setSortBy(sort)
    setCurrentPage(1)
  }

  const handleReportSuccess = () => {
    loadData()
    loadStats()
    showToast('举报已提交，等待管理员审核，感谢您的贡献！', 'success')
  }

  return (
    <div className="min-h-screen" style={{ background: '#0f1117' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-[100] px-6"
        style={{
          background: 'linear-gradient(135deg, #1a0a0a 0%, #1a1d27 60%, #0f1117 100%)',
          borderBottom: '1px solid rgba(232, 64, 64, 0.3)',
        }}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between h-16">
          <a className="flex items-center gap-2.5 no-underline" href="#">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
              style={{
                background: 'linear-gradient(135deg, #e84040, #c0392b)',
                boxShadow: '0 0 16px rgba(232,64,64,0.4)',
              }}
            >
              🚫
            </div>
            <div className="text-lg font-bold" style={{ color: '#e8eaf0' }}>
              外贸<span style={{ color: '#ff6b6b' }}>黑名单</span>预警平台
            </div>
          </a>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-[10px]"
              style={{
                background: dbStatus === 'online' ? 'rgba(46,204,113,0.1)' : 'rgba(245,166,35,0.1)',
                color: dbStatus === 'online' ? '#2ecc71' : '#f5a623',
                border: `1px solid ${dbStatus === 'online' ? 'rgba(46,204,113,0.2)' : 'rgba(245,166,35,0.2)'}`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
              {dbStatus === 'online' ? '数据库已连接' : '演示模式'}
            </span>
            <button
              onClick={() => setShowHowModal(true)}
              className="px-4 py-2 rounded-md text-xs cursor-pointer transition-all duration-200"
              style={{ border: '1px solid #2e3350', background: 'transparent', color: '#8b90a7' }}
              onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#e84040'; (e.target as HTMLElement).style.color = '#ff6b6b' }}
              onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#2e3350'; (e.target as HTMLElement).style.color = '#8b90a7' }}
            >
              使用说明
            </button>
            <ReportFormDialog onSuccess={handleReportSuccess} />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="px-6 pt-12 pb-9 text-center"
        style={{
          background: 'linear-gradient(180deg, rgba(232,64,64,0.06) 0%, transparent 100%)',
          borderBottom: '1px solid #2e3350',
        }}
      >
        <h1 className="text-[36px] font-extrabold mb-2.5" style={{ color: '#e8eaf0' }}>
          外贸买家 <span style={{ color: '#ff6b6b' }}>风险预警</span> 数据库
        </h1>
        <p className="text-sm max-w-[560px] mx-auto mb-8 leading-relaxed" style={{ color: '#8b90a7' }}>
          收录恶意仅退款、虚假纠纷、空包诈骗等高风险买家信息，保护外贸卖家合法权益
        </p>
        <div className="flex justify-center gap-8 flex-wrap">
          {[
            { label: '黑名单总数', value: stats.total },
            { label: '高风险买家', value: stats.highRisk },
            { label: '待审核举报', value: stats.pending },
            { label: '今日新增', value: stats.todayNew },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-[10px] px-8 py-[18px] min-w-[130px] transition-all duration-200"
              style={{ background: '#1a1d27', border: '1px solid #2e3350' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#e84040')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2e3350')}
            >
              <div className="text-[28px] font-extrabold" style={{ color: '#ff6b6b' }}>
                {card.label === '待审核举报' && card.value === 0 ? '—' : (card.value || '—')}
              </div>
              <div className="text-xs mt-1" style={{ color: '#8b90a7' }}>{card.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Main */}
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <SearchForm onSearch={handleSearch} />
        <BlacklistTable
          items={items}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalRows={totalRows}
          onPageChange={setCurrentPage}
          onViewDetail={setSelectedItem}
        />
      </main>

      {/* Detail Modal */}
      {selectedItem && (
        <DetailModal item={selectedItem} open={!!selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {/* How To Modal */}
      {showHowModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-5"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowHowModal(false)}
        >
          <div
            className="w-full max-w-[620px] max-h-[90vh] overflow-y-auto rounded-[14px] modal-animate"
            style={{ background: '#1a1d27', border: '1px solid #2e3350', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#2e3350' }}>
              <div className="text-[17px] font-bold" style={{ color: '#e8eaf0' }}>📖 使用说明</div>
              <button
                onClick={() => setShowHowModal(false)}
                className="w-[30px] h-[30px] rounded-md flex items-center justify-center text-lg cursor-pointer leading-none transition-all duration-200"
                style={{ border: '1px solid #2e3350', background: 'transparent', color: '#8b90a7' }}
              >
                ×
              </button>
            </div>
            <div className="px-6 py-6">
              <div className="flex flex-col gap-4 text-sm leading-relaxed" style={{ color: '#8b90a7' }}>
                <div style={{ background: 'rgba(232,64,64,0.06)', border: '1px solid rgba(232,64,64,0.15)', borderRadius: 8, padding: '14px' }}>
                  <strong style={{ color: '#ff6b6b' }}>⚠️ 免责声明</strong><br />
                  本平台收录信息由外贸卖家社区共同维护，仅供参考，不构成法律依据。所有举报均经人工审核后才公开。
                </div>
                <div><strong style={{ color: '#e8eaf0' }}>🔍 如何查询</strong><br />在搜索框输入买家姓名、邮箱地址、电话号码或收货地址，选择字段类型后点击查询。系统会自动关联匹配多个字段。</div>
                <div><strong style={{ color: '#e8eaf0' }}>📋 如何举报</strong><br />点击右上角「提交举报」按钮，填写买家信息。举报提交后进入人工审核队列，审核通过后才会公开显示。</div>
                <div><strong style={{ color: '#e8eaf0' }}>🔗 关联匹配机制</strong><br />系统通过邮箱地址、电话号码进行关联去重。同一买家使用不同账号，邮箱或电话一致时将被合并。</div>
                <div>
                  <strong style={{ color: '#e8eaf0' }}>🛡️ 风险等级</strong><br />
                  <span style={{ color: '#ff6b6b' }}>高风险</span>：多次恶意操作，存在诈骗行为<br />
                  <span style={{ color: '#f5a623' }}>中风险</span>：有过一次或少量投诉记录<br />
                  <span style={{ color: '#2ecc71' }}>低风险</span>：单次轻微纠纷，存疑买家
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: '#2e3350' }}>
              <button
                onClick={() => setShowHowModal(false)}
                className="px-6 py-2.5 rounded-[7px] text-sm font-semibold text-white cursor-pointer transition-all duration-200"
                style={{ background: '#e84040', border: 'none' }}
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-8 right-8 z-[999] rounded-[10px] px-5 py-3.5 flex items-center gap-2.5 toast-animate-in"
          style={{
            background: '#1a1d27',
            border: `1px solid ${toast.type === 'success' ? '#2ecc71' : '#e84040'}`,
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            fontSize: 14,
          }}
        >
          <span className="text-lg">{toast.type === 'success' ? '✅' : '❌'}</span>
          <span style={{ color: '#e8eaf0' }}>{toast.msg}</span>
        </div>
      )}
    </div>
  )
}
