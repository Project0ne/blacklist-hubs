import { Stats } from '@/types'

interface StatsCardsProps {
  stats: Stats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { label: '黑名单总数', value: stats.total, color: 'text-red-500' },
    { label: '高风险买家', value: stats.highRisk, color: 'text-red-500' },
    { label: '待审核举报', value: stats.pending, color: 'text-gray-400' },
    { label: '今日新增', value: stats.todayNew, color: 'text-red-500' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div 
          key={card.label} 
          className="bg-[#161822] border border-gray-800/50 rounded-xl p-6 text-center"
        >
          <div className={`text-4xl font-bold ${card.color} mb-2`}>
            {card.label === '待审核举报' && stats.pending === 0 ? '—' : card.value}
          </div>
          <div className="text-gray-400 text-sm">{card.label}</div>
        </div>
      ))}
    </div>
  )
}
