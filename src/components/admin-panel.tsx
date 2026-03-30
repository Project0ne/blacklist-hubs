'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BlacklistItem } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

export function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [items, setItems] = useState<BlacklistItem[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [currentTab, setCurrentTab] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [selectedItem, setSelectedItem] = useState<BlacklistItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectingId, setRejectingId] = useState<number | null>(null)

  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })

  const PAGE_SIZE = 15

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth')
    if (auth === '1') {
      setAuthenticated(true)
      loadData()
      loadStats()
    }
  }, [])

  useEffect(() => {
    if (authenticated) {
      loadData()
    }
  }, [currentPage, currentTab, searchQuery, riskFilter])

  const handleLogin = () => {
    const correctUsername = process.env.NEXT_PUBLIC_ADMIN_ACCOUNT || 'admin'
    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || ''

    if (username === correctUsername && password === correctPassword) {
      sessionStorage.setItem('admin_auth', '1')
      setAuthenticated(true)
      loadData()
      loadStats()
    } else {
      setLoginError('账号或密码错误')
    }
  }

  async function loadData() {
    setLoading(true)
    try {
      const from = (currentPage - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase
        .from('blacklist')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (currentTab !== 'all') query = query.eq('status', currentTab)
      if (riskFilter) query = query.eq('risk', riskFilter)
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
      }

      const { data, count, error } = await query
      if (error) throw error

      setItems(data || [])
      setTotalItems(count || 0)
      setTotalPages(Math.ceil((count || 0) / PAGE_SIZE))
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    try {
      const [pending, approved, rejected, total] = await Promise.all([
        supabase.from('blacklist').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('blacklist').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('blacklist').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
        supabase.from('blacklist').select('id', { count: 'exact', head: true }),
      ])

      setStats({
        pending: pending.count || 0,
        approved: approved.count || 0,
        rejected: rejected.count || 0,
        total: total.count || 0,
      })
    } catch (error) {
      console.error('加载统计失败:', error)
    }
  }

  async function quickAction(id: number, status: string) {
    try {
      const { error } = await supabase
        .from('blacklist')
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      alert(status === 'approved' ? '✅ 已通过审核' : '❌ 已驳回')
      loadData()
      loadStats()
    } catch (error: any) {
      alert('操作失败：' + error.message)
    }
  }

  async function handleReject(id: number) {
    setRejectingId(id)
    setShowRejectDialog(true)
  }

  async function confirmReject() {
    if (!rejectingId) return

    try {
      const { error } = await supabase
        .from('blacklist')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reject_reason: rejectReason || null,
        })
        .eq('id', rejectingId)

      if (error) throw error

      alert('❌ 已驳回')
      setShowRejectDialog(false)
      setRejectReason('')
      setRejectingId(null)
      loadData()
      loadStats()
    } catch (error: any) {
      alert('操作失败：' + error.message)
    }
  }

  async function deleteRecord(id: number) {
    if (!confirm('确认删除这条记录？此操作不可恢复。')) return

    try {
      const { error } = await supabase.from('blacklist').delete().eq('id', id)
      if (error) throw error

      alert('已删除')
      loadData()
      loadStats()
    } catch (error: any) {
      alert('删除失败：' + error.message)
    }
  }

  async function batchAction(status: string) {
    if (selectedIds.size === 0) return

    try {
      const { error } = await supabase
        .from('blacklist')
        .update({ status, reviewed_at: new Date().toISOString() })
        .in('id', Array.from(selectedIds))

      if (error) throw error

      alert(`已批量${status === 'approved' ? '通过' : '驳回'} ${selectedIds.size} 条`)
      setSelectedIds(new Set())
      loadData()
      loadStats()
    } catch (error: any) {
      alert('批量操作失败：' + error.message)
    }
  }

  async function batchDelete() {
    if (selectedIds.size === 0) return
    if (!confirm(`确认删除选中的 ${selectedIds.size} 条记录？此操作不可恢复。`)) return

    try {
      const { error } = await supabase.from('blacklist').delete().in('id', Array.from(selectedIds))
      if (error) throw error

      alert(`已删除 ${selectedIds.size} 条`)
      setSelectedIds(new Set())
      loadData()
      loadStats()
    } catch (error: any) {
      alert('批量删除失败：' + error.message)
    }
  }

  function toggleSelect(id: number, checked: boolean) {
    const newSet = new Set(selectedIds)
    if (checked) newSet.add(id)
    else newSet.delete(id)
    setSelectedIds(newSet)
  }

  function toggleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(items.map(i => i.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
        <div className="w-[380px] bg-[#161822] border border-gray-800 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">管理员登录</h2>
            <p className="text-sm text-gray-500 mt-1">请输入账号和密码以访问后台</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">管理员账号</label>
              <input
                placeholder="输入账号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 bg-[#1a1d27] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-red-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">管理员密码</label>
              <input
                type="password"
                placeholder="输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 bg-[#1a1d27] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-red-500/50"
              />
            </div>
            <button 
              onClick={handleLogin} 
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition"
            >
              登 录
            </button>
            {loginError && (
              <p className="text-sm text-red-400 text-center">{loginError}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#161822]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-gray-400 hover:text-white transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回前台
            </a>
            <div className="h-6 w-px bg-gray-700" />
            <span className="font-bold text-white">外贸黑名单 <span className="text-red-400">管理后台</span></span>
            <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded">ADMIN</span>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem('admin_auth'); location.reload(); }}
            className="px-4 py-2 text-sm border border-gray-700 rounded-lg text-gray-400 hover:border-red-500 hover:text-red-400 transition"
          >
            退出登录
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="border-b border-gray-800 bg-[#1a1d27]/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex gap-4">
          <StatCard label="待审核" value={stats.pending} color="text-yellow-400" bg="bg-yellow-500/10" border="border-yellow-500/20" />
          <StatCard label="已通过" value={stats.approved} color="text-green-400" bg="bg-green-500/10" border="border-green-500/20" />
          <StatCard label="已驳回" value={stats.rejected} color="text-red-400" bg="bg-red-500/10" border="border-red-500/20" />
          <StatCard label="全部举报" value={stats.total} color="text-blue-400" bg="bg-blue-500/10" border="border-blue-500/20" />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'pending', label: '待审核', badge: stats.pending },
            { key: 'approved', label: '已通过' },
            { key: 'rejected', label: '已驳回' },
            { key: 'all', label: '全部' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setCurrentTab(tab.key); setCurrentPage(1); setSelectedIds(new Set()); }}
              className={`
                px-5 py-2.5 rounded-lg font-medium transition
                ${currentTab === tab.key 
                  ? 'bg-red-500 text-white' 
                  : 'bg-[#1a1d27] border border-gray-700 text-gray-400 hover:border-gray-600'
                }
              `}
            >
              {tab.label}
              {tab.badge ? <span className="ml-2 px-2 py-0.5 bg-white/20 text-xs rounded-full">{tab.badge}</span> : null}
            </button>
          ))}
        </div>

        {/* Table Panel */}
        <div className="bg-[#161822] border border-gray-800/50 rounded-xl overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-gray-800/50 flex flex-wrap gap-3">
            <input
              placeholder="搜索买家姓名、邮箱、电话..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-3 bg-[#1a1d27] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-red-500/50"
            />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-4 py-3 bg-[#1a1d27] border border-gray-700 rounded-lg text-gray-300 focus:outline-none"
            >
              <option value="">全部风险</option>
              <option value="高">高风险</option>
              <option value="中">中风险</option>
              <option value="低">低风险</option>
            </select>
          </div>

          {/* Batch Actions */}
          {selectedIds.size > 0 && (
            <div className="p-4 bg-blue-500/10 border-b border-blue-500/20 flex items-center gap-3">
              <span className="text-sm text-blue-400">已选 {selectedIds.size} 条</span>
              <button onClick={() => batchAction('approved')} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition">
                ✓ 批量通过
              </button>
              <button onClick={() => batchAction('rejected')} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition">
                ✗ 批量驳回
              </button>
              <button onClick={batchDelete} className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:border-red-500 hover:text-red-400 text-sm transition">
                🗑 批量删除
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1a1d27]/50 border-b border-gray-800/50">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && items.every(i => selectedIds.has(i.id))}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="w-4 h-4 accent-red-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">买家姓名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">平台</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">邮箱</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">风险</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-12"><div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mx-auto" /></td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-500">📭 暂无记录</td></tr>
                ) : items.map((item) => (
                  <tr key={item.id} className={`border-t border-gray-800/30 hover:bg-gray-800/20 transition ${selectedIds.has(item.id) ? 'bg-blue-500/5' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.has(item.id)} onChange={(e) => toggleSelect(item.id, e.target.checked)} className="w-4 h-4 accent-red-500" />
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{item.platform || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{item.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        item.risk === '高' ? 'bg-red-500/20 text-red-400' : item.risk === '中' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {item.risk}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        item.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : item.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {item.status === 'pending' ? '⏳ 待审核' : item.status === 'approved' ? '✅ 已通过' : '❌ 已驳回'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedItem(item)} className="p-2 border border-gray-700 rounded hover:border-blue-500 hover:text-blue-400 transition" title="查看">
                          👁
                        </button>
                        {item.status !== 'approved' && (
                          <button onClick={() => quickAction(item.id, 'approved')} className="p-2 bg-green-500 rounded hover:bg-green-600 transition" title="通过">
                            ✓
                          </button>
                        )}
                        {item.status !== 'rejected' && (
                          <button onClick={() => handleReject(item.id)} className="p-2 bg-red-500 rounded hover:bg-red-600 transition" title="驳回">
                            ✗
                          </button>
                        )}
                        <button onClick={() => deleteRecord(item.id)} className="p-2 border border-gray-700 rounded hover:border-red-500 hover:text-red-400 transition" title="删除">
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-800/50 flex items-center justify-center gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-10 h-10 flex items-center justify-center border border-gray-700 rounded-lg text-gray-400 hover:border-red-500 disabled:opacity-30 transition">
                ‹
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 flex items-center justify-center rounded-lg transition ${currentPage === i + 1 ? 'bg-red-500 text-white' : 'border border-gray-700 text-gray-400 hover:border-red-500'}`}>
                  {i + 1}
                </button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="w-10 h-10 flex items-center justify-center border border-gray-700 rounded-lg text-gray-400 hover:border-red-500 disabled:opacity-30 transition">
                ›
              </button>
              <span className="text-sm text-gray-500 ml-4">共 {totalItems} 条</span>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
          <div className="bg-[#161822] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#161822]/95 backdrop-blur-sm border-b border-gray-800 p-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">📋 审核 — {selectedItem.name}</h2>
              <button onClick={() => setSelectedItem(null)} className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-700 hover:border-red-500 transition">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="买家姓名" value={selectedItem.name} />
                <InfoField label="风险等级" value={selectedItem.risk} />
                <InfoField label="邮箱" value={selectedItem.email} />
                <InfoField label="电话" value={selectedItem.phone || '未提供'} />
                <div className="col-span-2"><InfoField label="地址" value={selectedItem.address || '未提供'} /></div>
                <InfoField label="总订单金额" value={formatCurrency(selectedItem.order_amount)} />
                <InfoField label="退款/拒付金额" value={formatCurrency(selectedItem.refund_amount)} highlight />
                <InfoField label="白嫖金额" value={selectedItem.order_amount && selectedItem.refund_amount ? `$${((selectedItem.order_amount || 0) - (selectedItem.refund_amount || 0)).toFixed(2)}` : '-'} highlight />
                <InfoField label="损失承担方" value={selectedItem.loss_bearer || '-'} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">举报说明</label>
                <div className="p-3 bg-[#1a1d27] rounded-lg text-gray-300">{selectedItem.description || '-'}</div>
              </div>
              {selectedItem.evidence_images && selectedItem.evidence_images.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">损失截图</label>
                  <div className="flex gap-2 flex-wrap">
                    {selectedItem.evidence_images.map((url, i) => (
                      <img key={i} src={url} className="w-20 h-20 object-cover rounded-lg border border-gray-700 cursor-pointer hover:border-red-500/50" onClick={() => window.open(url)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-[400px] bg-[#161822] border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">驳回原因</h2>
            <textarea
              placeholder="请说明驳回原因，如：信息不完整、无法核实等..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-3 bg-[#1a1d27] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-red-500/50 min-h-[100px] mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRejectDialog(false)} className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 transition">取消</button>
              <button onClick={confirmReject} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition">确认驳回</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, bg, border }: { 
  label: string; value: number; color: string; bg: string; border: string 
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${bg} border ${border}`}>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  )
}

function InfoField({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`bg-[#1a1d27] p-2 rounded-lg text-sm ${highlight ? 'text-red-400' : 'text-gray-200'}`}>{value}</div>
    </div>
  )
}
