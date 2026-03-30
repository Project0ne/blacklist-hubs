'use client'

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
}

interface DetailModalProps {
  open: boolean
  onClose: () => void
  item: BlacklistItem | null
  onReport: () => void
}

export function DetailModal({ open, onClose, item, onReport }: DetailModalProps) {
  if (!open || !item) return null

  function platformClass(p?: string) {
    return { Amazon: 'platform-amazon', eBay: 'platform-ebay', Shopify: 'platform-shopify', AliExpress: 'platform-aliexpress', Wish: 'platform-wish' }[p || ''] || ''
  }

  function riskClass(r: string) {
    return { '高': 'risk-high', '中': 'risk-mid', '低': 'risk-low' }[r] || 'risk-low'
  }

  function riskLabel(r: string) {
    return { '高': '🔴 高风险', '中': '🔶 中风险', '低': '⚠️ 低风险' }[r] || r
  }

  function fmtDate(d?: string) {
    if (!d) return '-'
    return d.slice ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)
  }

  const related = item.related_emails || []

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">🔴 买家详情 — {item.name}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="detail-section">
            <div className="detail-section-title">基本信息</div>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="key">买家姓名</div>
                <div className="val">{item.name}</div>
              </div>
              <div className="detail-item">
                <div className="key">风险等级</div>
                <div className="val"><span className={`risk-badge ${riskClass(item.risk)}`}>{riskLabel(item.risk)}</span></div>
              </div>
              <div className="detail-item">
                <div className="key">平台</div>
                <div className="val">
                  <span className={`platform-tag ${platformClass(item.platform)}`}>{item.platform || '—'}</span>
                  {item.platform_id ? ` ${item.platform_id}` : ''}
                </div>
              </div>
              <div className="detail-item">
                <div className="key">纠纷类型</div>
                <div className="val">{item.dispute_type || '—'}</div>
              </div>
              <div className="detail-item">
                <div className="key">举报次数</div>
                <div className="val">{item.report_count || 1} 次</div>
              </div>
              <div className="detail-item">
                <div className="key">最近举报</div>
                <div className="val">{fmtDate(item.created_at)}</div>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-title">联系与地址</div>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="key">邮箱地址</div>
                <div className="val">{item.email}</div>
              </div>
              <div className="detail-item">
                <div className="key">电话号码</div>
                <div className="val">{item.phone || '未提供'}</div>
              </div>
              <div className="detail-item full">
                <div className="key">收货地址</div>
                <div className="val">{item.address || '未提供'}</div>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-title">关联账号</div>
              <div className="related-tags">
                {related.map((email, i) => (
                  <span key={i} className="related-tag">🔗 {email}</span>
                ))}
              </div>
            </div>
          )}

          <div className="detail-section">
            <div className="detail-section-title">举报内容</div>
            <div className="reports-timeline">
              <div className="report-item">
                <div className="report-item-header">
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>举报说明</span>
                  <span className="report-item-date">{fmtDate(item.created_at)}</span>
                </div>
                <div className="report-item-body">{item.description || '—'}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>关闭</button>
          <button className="btn-submit" onClick={onReport}>补充举报</button>
        </div>
      </div>
    </div>
  )
}
