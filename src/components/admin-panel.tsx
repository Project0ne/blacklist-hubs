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
      setLoginError('Invalid credentials')
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
      console.error('Load failed:', error)
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
      console.error('Stats failed:', error)
    }
  }

  async function quickAction(id: number, status: string) {
    try {
      const { error } = await supabase
        .from('blacklist')
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      alert(status === 'approved' ? 'APPROVED' : 'REJECTED')
      loadData()
      loadStats()
    } catch (error: any) {
      alert('Operation failed: ' + error.message)
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

      alert('REJECTED')
      setShowRejectDialog(false)
      setRejectReason('')
      setRejectingId(null)
      loadData()
      loadStats()
    } catch (error: any) {
      alert('Operation failed: ' + error.message)
    }
  }

  async function deleteRecord(id: number) {
    if (!confirm('Delete this record? This cannot be undone.')) return

    try {
      const { error } = await supabase.from('blacklist').delete().eq('id', id)
      if (error) throw error

      alert('DELETED')
      loadData()
      loadStats()
    } catch (error: any) {
      alert('Delete failed: ' + error.message)
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

      alert(`${status === 'approved' ? 'APPROVED' : 'REJECTED'} ${selectedIds.size} items`)
      setSelectedIds(new Set())
      loadData()
      loadStats()
    } catch (error: any) {
      alert('Batch operation failed: ' + error.message)
    }
  }

  async function batchDelete() {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} records? This cannot be undone.`)) return

    try {
      const { error } = await supabase.from('blacklist').delete().in('id', Array.from(selectedIds))
      if (error) throw error

      alert(`DELETED ${selectedIds.size} items`)
      setSelectedIds(new Set())
      loadData()
      loadStats()
    } catch (error: any) {
      alert('Batch delete failed: ' + error.message)
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
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        {/* 背景装饰 */}
        <div className="absolute inset-0 warning-stripes opacity-30" />
        
        <div className="relative w-[400px] animate-slide-up">
          {/* 顶部警告条 */}
          <div className="h-2 bg-gradient-to-r from-danger-600 via-hazard-500 to-danger-600 rounded-t-xl" />
          
          <div className="bg-surface-900 border border-surface-700 rounded-b-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-danger-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-danger-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-surface-100 tracking-tight">ADMIN ACCESS</h2>
              <p className="text-xs font-mono text-surface-500 mt-1">RESTRICTED AREA · AUTHORIZED PERSONNEL ONLY</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-surface-500 mb-2">USERNAME</label>
                <input
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="input-industrial"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-surface-500 mb-2">PASSWORD</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="input-industrial"
                />
              </div>
              <button 
                onClick={handleLogin} 
                className="w-full btn-industrial btn-industrial-danger py-4 font-bold tracking-wider"
              >
                AUTHENTICATE
              </button>
              {loginError && (
                <div className="p-3 bg-danger-500/10 border border-danger-500/30 rounded-lg text-center">
                  <p className="text-sm text-danger-400 font-mono">{loginError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-950">
      {/* 顶部警告条 */}
      <div className="h-1.5 bg-gradient-to-r from-danger-600 via-hazard-500 to-danger-600" />
      
      {/* Header */}
      <header className="border-b border-surface-800 bg-surface-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 text-surface-500 hover:text-surface-300 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-mono">BACK</span>
            </a>
            <div className="h-6 w-px bg-surface-700" />
            <span className="font-bold text-surface-200">ADMIN PANEL</span>
            <span className="hazard-badge hazard-badge-critical">ADMIN</span>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem('admin_auth'); location.reload(); }}
            className="btn-industrial text-sm"
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="border-b border-surface-800 bg-surface-900/50">
        <div className="container mx-auto px-6 py-4 flex gap-4">
          <StatCard label="PENDING" value={stats.pending} color="text-hazard-400" bg="bg-hazard-500/10" border="border-hazard-500/20" pulse />
          <StatCard label="APPROVED" value={stats.approved} color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20" />
          <StatCard label="REJECTED" value={stats.rejected} color="text-danger-400" bg="bg-danger-500/10" border="border-danger-500/20" />
          <StatCard label="TOTAL" value={stats.total} color="text-surface-200" bg="bg-surface-800" border="border-surface-700" />
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'pending', label: 'PENDING', badge: stats.pending },
            { key: 'approved', label: 'APPROVED' },
            { key: 'rejected', label: 'REJECTED' },
            { key: 'all', label: 'ALL' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setCurrentTab(tab.key); setCurrentPage(1); setSelectedIds(new Set()); }}
              className={`
                px-5 py-2.5 rounded-lg font-mono text-sm font-medium uppercase tracking-wider transition-all
                ${currentTab === tab.key 
                  ? 'bg-hazard-500 text-surface-950 shadow-lg shadow-hazard-500/20' 
                  : 'bg-surface-800 text-surface-400 border border-surface-700 hover:border-surface-600'
                }
              `}
            >
              {tab.label}
              {tab.badge ? (
                <span className="ml-2 px-2 py-0.5 bg-surface-950/20 text-xs rounded">{tab.badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Table Panel */}
        <div className="industrial-panel overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-hazard-600 via-surface-700 to-hazard-600" />
          
          {/* Search & Filters */}
          <div className="p-4 border-b border-surface-800 flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <input
                placeholder="SEARCH BY NAME, EMAIL, PHONE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-industrial"
              />
            </div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="input-industrial w-auto"
            >
              <option value="">ALL RISKS</option>
              <option value="高">HIGH RISK</option>
              <option value="中">MEDIUM RISK</option>
              <option value="低">LOW RISK</option>
            </select>
          </div>

          {/* Batch Actions */}
          {selectedIds.size > 0 && (
            <div className="p-4 bg-hazard-500/10 border-b border-hazard-500/20 flex items-center gap-3">
              <span className="text-sm font-mono text-hazard-400">{selectedIds.size} SELECTED</span>
              <button onClick={() => batchAction('approved')} className="btn-industrial text-sm !bg-emerald-600 !border-emerald-700">
                APPROVE
              </button>
              <button onClick={() => batchAction('rejected')} className="btn-industrial btn-industrial-danger text-sm">
                REJECT
              </button>
              <button onClick={batchDelete} className="btn-industrial text-sm">
                DELETE
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-800/50 border-b border-surface-700">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && items.every(i => selectedIds.has(i.id))}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="w-4 h-4 accent-hazard-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-mono font-medium text-surface-500 uppercase">BUYER</th>
                  <th className="px-4 py-3 text-left text-xs font-mono font-medium text-surface-500 uppercase">PLATFORM</th>
                  <th className="px-4 py-3 text-left text-xs font-mono font-medium text-surface-500 uppercase">RISK</th>
                  <th className="px-4 py-3 text-left text-xs font-mono font-medium text-surface-500 uppercase">STATUS</th>
                  <th className="px-4 py-3 text-left text-xs font-mono font-medium text-surface-500 uppercase">DATE</th>
                  <th className="px-4 py-3 text-left text-xs font-mono font-medium text-surface-500 uppercase">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12"><div className="animate-spin w-6 h-6 border-2 border-hazard-500 border-t-transparent rounded-full mx-auto" /></td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-surface-500 font-mono">NO RECORDS</td></tr>
                ) : items.map((item) => (
                  <tr key={item.id} className={`border-t border-surface-800 hover:bg-surface-800/30 transition-colors ${selectedIds.has(item.id) ? 'bg-hazard-500/5' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.has(item.id)} onChange={(e) => toggleSelect(item.id, e.target.checked)} className="w-4 h-4 accent-hazard-500" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-surface-200">{item.name}</div>
                      <div className="text-xs font-mono text-surface-500">{item.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-surface-400">{item.platform || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`hazard-badge ${item.risk === '高' ? 'hazard-badge-critical' : item.risk === '中' ? 'hazard-badge-warning' : 'hazard-badge-safe'}`}>
                        {item.risk === '高' ? 'HIGH' : item.risk === '中' ? 'MED' : 'LOW'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`hazard-badge ${item.status === 'pending' ? 'hazard-badge-warning' : item.status === 'approved' ? 'hazard-badge-safe' : 'hazard-badge-critical'}`}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-surface-500">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedItem(item)} className="w-8 h-8 flex items-center justify-center rounded bg-surface-800 border border-surface-700 text-surface-400 hover:bg-surface-700 hover:text-surface-200 transition-all" title="View">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {item.status !== 'approved' && (
                          <button onClick={() => quickAction(item.id, 'approved')} className="w-8 h-8 flex items-center justify-center rounded bg-emerald-600 text-white hover:bg-emerald-500 transition-all" title="Approve">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        {item.status !== 'rejected' && (
                          <button onClick={() => handleReject(item.id)} className="w-8 h-8 flex items-center justify-center rounded bg-danger-600 text-white hover:bg-danger-500 transition-all" title="Reject">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        <button onClick={() => deleteRecord(item.id)} className="w-8 h-8 flex items-center justify-center rounded bg-surface-800 border border-surface-700 text-surface-400 hover:bg-danger-600 hover:border-danger-700 hover:text-white transition-all" title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
            <div className="p-4 border-t border-surface-800 flex items-center justify-center gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-800 border border-surface-700 text-surface-400 hover:bg-surface-700 disabled:opacity-30 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 flex items-center justify-center rounded-lg font-mono text-sm transition-all ${currentPage === i + 1 ? 'bg-hazard-500 text-surface-950' : 'bg-surface-800 border border-surface-700 text-surface-400 hover:bg-surface-700'}`}>
                  {i + 1}
                </button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-800 border border-surface-700 text-surface-400 hover:bg-surface-700 disabled:opacity-30 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <span className="text-sm font-mono text-surface-500 ml-4">{totalItems} TOTAL</span>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="h-1.5 bg-gradient-to-r from-hazard-500 via-danger-500 to-hazard-500" />
            <div className="modal-header">
              <h2 className="text-lg font-bold">REVIEW · {selectedItem.name}</h2>
              <button onClick={() => setSelectedItem(null)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-800 border border-surface-700 hover:bg-surface-700 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="Name" value={selectedItem.name} />
                <InfoField label="Risk" value={selectedItem.risk} />
                <InfoField label="Email" value={selectedItem.email} mono />
                <InfoField label="Phone" value={selectedItem.phone || 'N/A'} mono />
                <div className="col-span-2"><InfoField label="Address" value={selectedItem.address || 'N/A'} /></div>
                <InfoField label="Order Amount" value={formatCurrency(selectedItem.order_amount)} mono />
                <InfoField label="Refund Amount" value={formatCurrency(selectedItem.refund_amount)} mono danger />
                <InfoField label="Cargo Loss" value={selectedItem.has_cargo_loss ? 'YES' : 'NO'} />
                <InfoField label="Loss Amount" value={formatCurrency(selectedItem.cargo_loss_amount)} mono />
              </div>
              <div>
                <label className="text-xs font-mono text-surface-500 mb-1 block">DESCRIPTION</label>
                <div className="p-3 bg-surface-800 rounded-lg text-sm">{selectedItem.description || '-'}</div>
              </div>
              {selectedItem.evidence_images && selectedItem.evidence_images.length > 0 && (
                <div>
                  <label className="text-xs font-mono text-surface-500 mb-2 block">EVIDENCE</label>
                  <div className="flex gap-2 flex-wrap">
                    {selectedItem.evidence_images.map((url, i) => (
                      <img key={i} src={url} className="w-20 h-20 object-cover rounded-lg border border-surface-700 cursor-pointer hover:border-hazard-500/50" onClick={() => window.open(url)} />
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
        <div className="modal-backdrop">
          <div className="w-[400px] modal-content p-6 animate-slide-up">
            <h2 className="text-lg font-bold mb-4">REASON FOR REJECTION</h2>
            <textarea
              placeholder="Explain why this is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input-industrial min-h-[100px] mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRejectDialog(false)} className="btn-industrial">CANCEL</button>
              <button onClick={confirmReject} className="btn-industrial btn-industrial-danger">CONFIRM REJECTION</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, bg, border, pulse }: { 
  label: string; value: number; color: string; bg: string; border: string; pulse?: boolean 
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${bg} border ${border}`}>
      {pulse && <span className="status-dot status-dot-warning" />}
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-xs font-mono text-surface-500">{label}</div>
    </div>
  )
}

function InfoField({ label, value, mono, danger }: { label: string; value: React.ReactNode; mono?: boolean; danger?: boolean }) {
  return (
    <div>
      <label className="text-xs font-mono text-surface-500 mb-1 block">{label}</label>
      <div className={`bg-surface-800 p-2 rounded text-sm ${mono ? 'font-mono' : ''} ${danger ? 'text-danger-400' : ''}`}>{value}</div>
    </div>
  )
}
