'use client'

interface HowModalProps {
  open: boolean
  onClose: () => void
}

export function HowModal({ open, onClose }: HowModalProps) {
  if (!open) return null

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">📖 使用说明</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', lineHeight: '1.7', color: 'var(--text2)' }}>
            <div style={{ background: 'rgba(232,64,64,0.06)', border: '1px solid rgba(232,64,64,0.15)', borderRadius: '8px', padding: '14px' }}>
              <strong style={{ color: 'var(--accent2)' }}>⚠️ 免责声明</strong><br />
              本平台收录信息由外贸卖家社区共同维护，仅供参考，不构成法律依据。所有举报均经人工审核后才公开。
            </div>
            <div>
              <strong style={{ color: 'var(--text)' }}>🔍 如何查询</strong><br />
              在搜索框输入买家姓名、邮箱地址、电话号码或收货地址，选择字段类型后点击查询。系统会自动关联匹配多个字段。
            </div>
            <div>
              <strong style={{ color: 'var(--text)' }}>📋 如何举报</strong><br />
              点击右上角「提交举报」按钮，填写买家信息。举报提交后进入人工审核队列，审核通过后才会公开显示。
            </div>
            <div>
              <strong style={{ color: 'var(--text)' }}>🔗 关联匹配机制</strong><br />
              系统通过邮箱地址、电话号码进行关联去重。同一买家使用不同账号，邮箱或电话一致时将被合并。
            </div>
            <div>
              <strong style={{ color: 'var(--text)' }}>🛡️ 风险等级</strong><br />
              <span style={{ color: 'var(--accent2)' }}>高风险</span>：多次恶意操作，存在诈骗行为<br />
              <span style={{ color: 'var(--gold)' }}>中风险</span>：有过一次或少量投诉记录<br />
              <span style={{ color: 'var(--green)' }}>低风险</span>：单次轻微纠纷，存疑买家
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-submit" onClick={onClose}>我知道了</button>
        </div>
      </div>
    </div>
  )
}
