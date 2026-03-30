import { Stats } from '@/types'

interface StatsCardsProps {
  stats: Stats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { label: '黑名单总数', value: stats.total, color: 'text-blue-400' },
    { label: '高风险买家', value: stats.highRisk, color: 'text-red-400' },
    { label: '待审核举报', value: stats.pending, color: 'text-yellow-400' },
    { label: '今日新增', value: stats.todayNew, color: 'text-green-400' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className={`text-3xl font-bold ${card.color}`}>
            {card.value.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400 mt-1">{card.label}</div>
        </div>
      ))}
    </div>
  )
}
