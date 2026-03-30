import { Stats } from '@/types'

interface StatsCardsProps {
  stats: Stats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { 
      label: 'TOTAL BLACKLIST', 
      value: stats.total, 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: 'text-surface-100',
      bg: 'from-surface-800 to-surface-900',
      border: 'border-surface-700'
    },
    { 
      label: 'HIGH RISK', 
      value: stats.highRisk, 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-danger-400',
      bg: 'from-danger-900/50 to-surface-900',
      border: 'border-danger-800/50',
      glow: true
    },
    { 
      label: 'PENDING REVIEW', 
      value: stats.pending, 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-hazard-400',
      bg: 'from-hazard-900/30 to-surface-900',
      border: 'border-hazard-800/30',
      pulse: true
    },
    { 
      label: 'TODAY NEW', 
      value: stats.todayNew, 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      color: 'text-emerald-400',
      bg: 'from-emerald-900/30 to-surface-900',
      border: 'border-emerald-800/30'
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, index) => (
        <div 
          key={card.label}
          className={`
            relative overflow-hidden rounded-xl border ${card.border}
            bg-gradient-to-br ${card.bg}
            p-5 transition-all duration-300 hover:-translate-y-0.5
            ${card.glow ? 'hover:shadow-lg hover:shadow-danger-500/10' : ''}
          `}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* 装饰性角落 */}
          <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-current" />
            <div className="absolute top-8 right-8 w-2 h-2 border-t border-r border-current" />
          </div>
          
          <div className="relative">
            <div className={`mb-3 ${card.color} opacity-60`}>
              {card.icon}
            </div>
            <div className={`text-4xl font-bold font-mono ${card.color} tracking-tight`}>
              {card.value.toLocaleString()}
            </div>
            <div className="mt-2 flex items-center gap-2">
              {card.pulse && <span className="status-dot status-dot-warning" />}
              <span className="text-xs font-mono text-surface-500 uppercase tracking-wider">
                {card.label}
              </span>
            </div>
          </div>

          {/* 背景装饰 */}
          <div className="absolute inset-0 opacity-3">
            <div className="absolute bottom-0 right-0 w-32 h-32 transform translate-x-8 translate-y-8">
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
