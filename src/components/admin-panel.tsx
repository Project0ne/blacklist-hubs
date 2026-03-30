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
      setLoginError('账号或密码错误，请重试')
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
        .in('id', [...selectedIds])

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
      const { error } = await supabase.from('blacklist').delete().in('id', [...selectedIds])
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
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-[360px] bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-xl font-bold mb-2">管理员登录</h2>
          <p className="text-sm text-gray-400 mb-6">请输入账号和密码以访问后台</p>
          <div className="space-y-3">
            <input
              placeholder="管理员账号"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 outline-none focus:border-red-500"
            />
            <input
              type="password"
              placeholder="管理员密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 outline-none focus:border-red-500"
            />
            <button onClick={handleLogin} className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-md font-medium transition">
              登 录
            </button>
            {loginError && <div className="text-sm text-red-400">{loginError}</div>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-gray-400 hover:text-gray-200">← 返回前台</a>
            <span className="font-bold">外贸黑名单 <span className="text-red-400">管理后台</span></span>
            <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded">ADMIN</span>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem('admin_auth'); location.reload(); }}
            className="px-3 py-1 text-sm border border-gray-700 rounded text-gray-400 hover:border-red-500 hover:text-red-400 transition"
          >
            退出登录
          </button>
        </div>
      </header>

      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="container mx-auto px-4 py-4 flex gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center gap-3">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-xs text-gray-400">待审核</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center gap-3">
            <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
            <div className="text-xs text-gray-400">已通过</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center gap-3">
            <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
            <div className="text-xs text-gray-400">已驳回</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center gap-3">
            <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
            <div className="text-xs text-gray-400">全部举报</div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <div className="flex gap-2 mb-4">
          {[
            { key: 'pending', label: '待审核', badge: stats.pending },
            { key: 'approved', label: '已通过' },
            { key: 'rejected', label: '已驳回' },
            { key: 'all', label: '全部' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setCurrentTab(tab.key); setCurrentPage(1); setSelectedIds(new Set()); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                currentTab === tab.key ? 'bg-red-600' : 'bg-gray-800 border border-gray-700 hover:border-gray-500'
              }`}
            >
              {tab.label}
              {tab.badge ? <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-full">{tab.badge}</span> : null}
            </button>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg">
          <div className="p-4 border-b border-gray-800 flex flex-wrap gap-3">
            <input
              placeholder="搜索买家姓名、邮箱、电话..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px] bg-gray-800 border border-gray-700 rounded-md px-3 py-2 outline-none focus:border-red-500"
            />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-[120px] bg-gray-800 border border-gray-700 rounded-md px-3 py-2 outline-none"
            >
              <option value="">全部风险</option>
              <option value="高">高风险</option>
              <option value="中">中风险</option>
              <option value="低">低风险</option>
            </select>
          </div>

          {selectedIds.size > 0 && (
            <div className="p-3 bg-blue-500/10 border-b border-blue-500/20 flex items-center gap-3">
              <span className="text-sm text-blue-400">已选 {selectedIds.size} 条</span>
              <button onClick={() => batchAction('approved')} className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 rounded transition">
                ✓ 批量通过
              </button>
              <button onClick={() => batchAction('rejected')} className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded transition">
                ✗ 批量驳回
              </button>
              <button onClick={batchDelete} className="px-3 py-1 text-sm border border-gray-700 rounded hover:border-red-500 transition">
                🗑 批量删除
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/50 text-left">
                  <th className="px-4 py-3 text-xs text-gray-400 font-medium w-10">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && items.every(i => selectedIds.has(i.id))}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="w-4 h-4 accent-red-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-xs text-gray-400 font-medium">买家姓名</th>
                  <th className="px-4 py-3 text-xs text-gray-400 font-medium">平台</th>
                  <th className="px-4 py-3 text-xs text-gray-400 font-medium">邮箱</th>
                  <th className="px-4 py-3 text-xs text-gray-400 font-medium">电话</th>
                  <th className="px-4 py-3 text-xs text-gray-400 font-medium">风险</th>
                  <th className="px-4 py-3 text-xs text-gray-400 font-medium">纠纷类型</th>
                  <th className="px-4 py-3 text-xs text-gray-400 font-medium">订单金额</th>
                  <th className="px-4 py-3 text-xs text-gray-400 font-medium">退款金额</th>
                  <th className="px-4 py-3 text-xs text-gray-400 font-medium">状态</th>
                  <th className="px-4 py-3 text-xs text-gray-400 font-medium">提交时间</th>
                  <th className="px-4 py-3 text-xs text-gray-400 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={12} className="text-center py-8"><div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mx-auto"></div></td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={12} className="text-center py-8 text-gray-500">📭 暂无记录</td></tr>
                ) : items.map((item) => (
                  <tr key={item.id} className={`border-t border-gray-800 hover:bg-gray-800/30 ${selectedIds.has(item.id) ? 'bg-blue-500/5' : ''}`}>
                    <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.has(item.id)} onChange={(e) => toggleSelect(item.id, e.target.checked)} className="w-4 h-4 accent-red-600" /></td>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{item.platform || '-'}</td>
                    <td className="px-4 py-3 text-sm">{item.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{item.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.risk === '高' ? 'bg-red-500/20 text-red-400' : item.risk === '中' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {item.risk === '高' ? '🔴' : item.risk === '中' ? '🔶' : '⚠️'} {item.risk}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{item.dispute_type || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{item.order_amount ? `$${item.order_amount}` : '-'}</td>
                    <td className="px-4 py-3 text-sm text-red-400">{item.refund_amount ? `$${item.refund_amount}` : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : item.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {item.status === 'pending' ? '⏳ 待审核' : item.status === 'approved' ? '✅ 已通过' : '❌ 已驳回'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setSelectedItem(item)} className="w-7 h-7 flex items-center justify-center border border-gray-700 rounded text-xs hover:border-blue-500">👁</button>
                        {item.status !== 'approved' && <button onClick={() => quickAction(item.id, 'approved')} className="w-7 h-7 flex items-center justify-center bg-green-600 rounded text-xs hover:bg-green-700">✓</button>}
                        {item.status !== 'rejected' && <button onClick={() => handleReject(item.id)} className="w-7 h-7 flex items-center justify-center bg-red-600 rounded text-xs hover:bg-red-700">✗</button>}
                        <button onClick={() => deleteRecord(item.id)} className="w-7 h-7 flex items-center justify-center border border-gray-700 rounded text-xs hover:border-red-500">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-800 flex items-center justify-center gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-8 h-8 flex items-center justify-center border border-gray-700 rounded disabled:opacity-30">‹</button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 flex items-center justify-center rounded ${currentPage === i + 1 ? 'bg-red-600' : 'border border-gray-700'}`}>{i + 1}</button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="w-8 h-8 flex items-center justify-center border border-gray-700 rounded disabled:opacity-30">›</button>
              <span className="text-sm text-gray-400 ml-2">共 {totalItems} 条</span>
            </div>
          )}
        </div>
      </main>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">📋 审核 — {selectedItem.name}</h2>
              <button onClick={() => setSelectedItem(null)} className="w-8 h-8 flex items-center justify-center rounded border border-gray-700 hover:border-red-500">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><div className="text-xs text-gray-500 mb-1">买家姓名</div><div className="bg-gray-800 p-2 rounded text-sm">{selectedItem.name}</div></div>
                <div><div className="text-xs text-gray-500 mb-1">风险等级</div><div className="bg-gray-800 p-2 rounded text-sm">{selectedItem.risk}</div></div>
                <div><div className="text-xs text-gray-500 mb-1">邮箱</div><div className="bg-gray-800 p-2 rounded text-sm">{selectedItem.email}</div></div>
                <div><div className="text-xs text-gray-500 mb-1">电话</div><div className="bg-gray-800 p-2 rounded text-sm">{selectedItem.phone || '未提供'}</div></div>
                <div className="col-span-2"><div className="text-xs text-gray-500 mb-1">地址</div><div className="bg-gray-800 p-2 rounded text-sm">{selectedItem.address || '未提供'}</div></div>
                <div><div className="text-xs text-gray-500 mb-1">总订单金额</div><div className="bg-gray-800 p-2 rounded text-sm">{formatCurrency(selectedItem.order_amount)}</div></div>
                <div><div className="text-xs text-gray-500 mb-1">退款金额</div><div className="bg-gray-800 p-2 rounded text-sm">{formatCurrency(selectedItem.refund_amount)}</div></div>
                <div><div className="text-xs text-gray-500 mb-1">货物损失</div><div className="bg-gray-800 p-2 rounded text-sm">{selectedItem.has_cargo_loss ? '❌ 是' : '✅ 否'}</div></div>
                <div><div className="text-xs text-gray-500 mb-1">损失金额</div><div className="bg-gray-800 p-2 rounded text-sm">{formatCurrency(selectedItem.cargo_loss_amount)}</div></div>
              </div>
              <div><div className="text-xs text-gray-500 mb-1">举报说明</div><div className="bg-gray-800 p-3 rounded text-sm">{selectedItem.description || '-'}</div></div>
              {selectedItem.evidence_images && selectedItem.evidence_images.length > 0 && (
                <div><div className="text-xs text-gray-500 mb-2">损失截图</div><div className="flex gap-2 flex-wrap">{selectedItem.evidence_images.map((url, i) => <img key={i} src={url} className="w-20 h-20 object-cover rounded cursor-pointer" onClick={() => window.open(url)} />)}</div></div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">驳回原因</h2>
            <textarea
              placeholder="请说明驳回原因，如：信息不完整、无法核实等..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 outline-none focus:border-red-500 min-h-[100px]"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowRejectDialog(false)} className="px-4 py-2 border border-gray-700 rounded-md text-sm">取消</button>
              <button onClick={confirmReject} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm">确认驳回</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
