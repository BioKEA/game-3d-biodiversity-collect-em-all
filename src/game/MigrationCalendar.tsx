import type { Creature } from '@/types/game'
import { ALL_CREATURES } from './creatures'
import { getMonth, getMonthName, isCreatureInSeason } from './timeWeather'
import FloatingPanel from './FloatingPanel'
import PixelCreatureToken from './PixelCreatureToken'
import PixelIcon from './PixelIcon'

interface Props {
  gameDay: number
  onClose: () => void
}

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

interface MigrantRow {
  creature: Creature
  window: { startMonth: number; endMonth: number }
  activeMonths: boolean[]
}

function buildMigrants(): MigrantRow[] {
  const rows: MigrantRow[] = []
  for (const c of ALL_CREATURES) {
    if (!c.migrationWindow) continue
    const { startMonth, endMonth } = c.migrationWindow
    const activeMonths: boolean[] = []
    for (let m = 0; m < 12; m++) {
      if (startMonth <= endMonth) {
        activeMonths.push(m >= startMonth && m <= endMonth)
      } else {
        activeMonths.push(m >= startMonth || m <= endMonth)
      }
    }
    rows.push({ creature: c, window: c.migrationWindow, activeMonths })
  }
  // Sort by start month
  rows.sort((a, b) => a.window.startMonth - b.window.startMonth)
  return rows
}

export default function MigrationCalendar({ gameDay, onClose }: Props) {
  const rows = buildMigrants()
  const currentMonth = getMonth(gameDay)
  const currentMonthName = getMonthName(gameDay)

  const inSeasonNow = rows.filter(r => isCreatureInSeason(r.window, gameDay))

  return (
    <FloatingPanel
      title="Migration Calendar"
      subtitle={`${inSeasonNow.length} migrants in season · ${currentMonthName}`}
      onClose={onClose}
      width="md"
    >
      <div className="p-4 space-y-4">
        {/* Current month header */}
        <div
          className="rounded-lg p-3"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(251,146,60,0.05) 100%)',
            border: '1px solid rgba(251,191,36,0.15)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <PixelIcon icon="📅" size={22} variant="gold" />
            <span className="text-white/90 text-xs font-semibold">Now: {currentMonthName}</span>
          </div>
          <p className="text-white/50 text-[10px] leading-relaxed">
            {inSeasonNow.length > 0
              ? `${inSeasonNow.map(r => r.creature.name).join(', ')} ${inSeasonNow.length === 1 ? 'is' : 'are'} passing through the Bay right now.`
              : 'No migrants active this month. Check back later in the year.'}
          </p>
        </div>

        {/* Month header row */}
        <div className="flex items-center gap-2 pr-1">
          <div className="w-[110px] shrink-0" />
          <div className="flex-1 grid grid-cols-12 gap-[2px]">
            {MONTH_LABELS.map((label, i) => (
              <div
                key={i}
                className="text-center text-[8px] uppercase tracking-wider font-bold"
                style={{
                  color: i === currentMonth ? '#fbbf24' : 'rgba(255,255,255,0.3)',
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Migrant rows */}
        <div className="space-y-2">
          {rows.map(row => {
            const isNow = row.activeMonths[currentMonth]
            return (
              <div key={row.creature.id} className="flex items-center gap-2">
                {/* Name + sprite */}
                <div className="w-[110px] shrink-0 flex items-center gap-1.5 min-w-0">
                  <PixelCreatureToken creature={row.creature} size={20} />
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[10px] font-medium truncate"
                      style={{ color: isNow ? '#ffffff' : 'rgba(255,255,255,0.55)' }}
                    >
                      {row.creature.name}
                    </div>
                    {row.creature.conservationStatus && (
                      <div
                        className="text-[8px] uppercase tracking-wider"
                        style={{ color: conservationColor(row.creature.conservationStatus) }}
                      >
                        {row.creature.conservationStatus}
                      </div>
                    )}
                  </div>
                </div>

                {/* 12-month bar */}
                <div className="flex-1 grid grid-cols-12 gap-[2px]">
                  {row.activeMonths.map((active, m) => {
                    const isCurrentCell = m === currentMonth
                    return (
                      <div
                        key={m}
                        className="h-5 rounded-sm transition-all"
                        style={{
                          background: active
                            ? isCurrentCell
                              ? 'linear-gradient(180deg, #fbbf24, #f59e0b)'
                              : 'linear-gradient(180deg, rgba(52,211,153,0.65), rgba(16,185,129,0.55))'
                            : 'rgba(255,255,255,0.04)',
                          border: isCurrentCell
                            ? '1px solid rgba(251,191,36,0.5)'
                            : '1px solid rgba(255,255,255,0.03)',
                          boxShadow: active && isCurrentCell ? '0 0 6px rgba(251,191,36,0.4)' : 'none',
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {rows.length === 0 && (
          <div className="text-center py-6 text-white/40 text-xs">No migrant species tracked yet.</div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-3 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(180deg, #fbbf24, #f59e0b)' }} />
            <span className="text-white/40 text-[9px]">Now</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(180deg, rgba(52,211,153,0.65), rgba(16,185,129,0.55))' }} />
            <span className="text-white/40 text-[9px]">In Season</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            <span className="text-white/40 text-[9px]">Absent</span>
          </div>
        </div>
      </div>
    </FloatingPanel>
  )
}

function conservationColor(status: string): string {
  switch (status) {
    case 'CR': return '#ef4444'
    case 'EN': return '#f97316'
    case 'VU': return '#f59e0b'
    case 'NT': return '#eab308'
    case 'LC': return '#22c55e'
    case 'INV': return '#a855f7'
    case 'NA': return '#6b7280'
    case 'EX': return '#991b1b'
    default: return '#94a3b8'
  }
}
