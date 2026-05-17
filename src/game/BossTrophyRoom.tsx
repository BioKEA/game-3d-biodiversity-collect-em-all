import { memo } from 'react'
import type { BossDefeat } from '@/types/game'
import { LUNAR_BOSSES, SHADOW_BOSSES } from './creatures'
import FloatingPanel from './FloatingPanel'
import PixelCreatureToken from './PixelCreatureToken'
import PixelIcon from './PixelIcon'

interface Props {
  defeats: BossDefeat[]
  onClose: () => void
}

const ALL_BOSSES = [...LUNAR_BOSSES, ...SHADOW_BOSSES]

function getSeasonLabel(gameDay: number): string {
  const day = ((gameDay % 360) + 360) % 360
  if (day < 90) return 'Spring'
  if (day < 180) return 'Summer'
  if (day < 270) return 'Autumn'
  return 'Winter'
}

function getDayLabel(gameDay: number): string {
  const season = getSeasonLabel(gameDay)
  const dayInSeason = ((gameDay % 90) + 90) % 90 + 1
  return `${season} Day ${dayInSeason}`
}

const BossTrophyRoom = memo(function BossTrophyRoom({ defeats, onClose }: Props) {
  const lunarDefeats = defeats.filter(d => d.bossType === 'lunar')
  const shadowDefeats = defeats.filter(d => d.bossType === 'shadow')

  const lunarIds = new Set(lunarDefeats.map(d => d.bossId))
  const shadowIds = new Set(shadowDefeats.map(d => d.bossId))

  return (
    <FloatingPanel onClose={onClose} title="Boss Trophy Room">
      <div className="flex flex-col gap-5 p-4 max-h-[70vh] overflow-y-auto">
        {/* Lunar bosses section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <PixelIcon icon="🌕" size={24} variant="mystic" selected />
            <h3 className="text-sm font-bold tracking-wider uppercase" style={{
              color: 'rgba(200,210,255,0.8)',
            }}>
              Lunar Bosses
            </h3>
            <span className="text-[10px] ml-auto" style={{ color: 'rgba(200,210,255,0.4)' }}>
              {lunarIds.size}/{LUNAR_BOSSES.length} discovered
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {LUNAR_BOSSES.map(boss => {
              const defeated = lunarDefeats.filter(d => d.bossId === boss.id)
              const isDefeated = defeated.length > 0
              const captured = defeated.some(d => d.captured)
              return (
                <TrophyCard
                  key={boss.id}
                  boss={boss}
                  defeated={isDefeated}
                  captured={captured}
                  defeatCount={defeated.length}
                  lastDefeat={defeated.length > 0 ? defeated[defeated.length - 1] : undefined}
                  type="lunar"
                />
              )
            })}
          </div>
        </div>

        {/* Shadow bosses section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <PixelIcon icon="🌑" size={24} variant="mystic" selected />
            <h3 className="text-sm font-bold tracking-wider uppercase" style={{
              color: 'rgba(168,85,247,0.8)',
            }}>
              Shadow Bosses
            </h3>
            <span className="text-[10px] ml-auto" style={{ color: 'rgba(168,85,247,0.4)' }}>
              {shadowIds.size}/{SHADOW_BOSSES.length} discovered
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SHADOW_BOSSES.map(boss => {
              const defeated = shadowDefeats.filter(d => d.bossId === boss.id)
              const isDefeated = defeated.length > 0
              const captured = defeated.some(d => d.captured)
              return (
                <TrophyCard
                  key={boss.id}
                  boss={boss}
                  defeated={isDefeated}
                  captured={captured}
                  defeatCount={defeated.length}
                  lastDefeat={defeated.length > 0 ? defeated[defeated.length - 1] : undefined}
                  type="shadow"
                />
              )
            })}
          </div>
        </div>

        {/* Stats summary */}
        {defeats.length > 0 && (
          <div className="mt-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-around text-center">
              <div>
                <p className="text-xl font-bold text-white">{defeats.length}</p>
                <p className="text-[9px] text-white/40 uppercase tracking-wider">Total Battles</p>
              </div>
              <div>
                <p className="text-xl font-bold text-amber-400">{defeats.filter(d => d.captured).length}</p>
                <p className="text-[9px] text-white/40 uppercase tracking-wider">Captured</p>
              </div>
              <div>
                <p className="text-xl font-bold text-purple-400">{new Set(defeats.map(d => d.bossId)).size}</p>
                <p className="text-[9px] text-white/40 uppercase tracking-wider">Unique Bosses</p>
              </div>
            </div>
          </div>
        )}

        {defeats.length === 0 && (
          <div className="text-center py-6 text-white/30 text-sm">
            <PixelIcon icon="🏆" size={44} variant="gold" className="mb-3 mx-auto" />
            <p>No bosses defeated yet.</p>
            <p className="text-[10px] mt-1 text-white/20">
              Explore during full moon or new moon nights to encounter bosses.
            </p>
          </div>
        )}
      </div>
    </FloatingPanel>
  )
})

function TrophyCard({ boss, defeated, captured, defeatCount, lastDefeat, type }: {
  boss: typeof ALL_BOSSES[number]
  defeated: boolean
  captured: boolean
  defeatCount: number
  lastDefeat?: BossDefeat
  type: 'lunar' | 'shadow'
}) {
  const accentColor = type === 'lunar' ? 'rgba(200,210,255,' : 'rgba(168,85,247,'

  return (
    <div
      className="relative rounded-lg overflow-hidden p-3"
      style={{
        background: defeated
          ? `linear-gradient(135deg, ${accentColor}0.08), ${accentColor}0.03))`
          : 'rgba(255,255,255,0.03)',
        border: defeated
          ? `1px solid ${accentColor}0.2)`
          : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Sprite */}
      <div className="flex items-center gap-2 mb-2">
        {defeated ? (
          <PixelCreatureToken creature={boss} size={40} selected={captured} style={{ filter: `drop-shadow(0 0 8px ${boss.color}60)` }} />
        ) : (
          <span className="text-white/15 text-lg">?</span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate" style={{
            opacity: defeated ? 1 : 0.3,
          }}>
            {defeated ? boss.name : '???'}
          </p>
          <p className="text-[9px]" style={{ color: `${accentColor}0.5)` }}>
            {defeated ? boss.type : 'Unknown'}
          </p>
        </div>
      </div>

      {/* Stats */}
      {defeated && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[9px]">
            <span className="text-white/40">Defeated</span>
            <span className="font-bold text-white/70">×{defeatCount}</span>
          </div>
          {lastDefeat && (
            <div className="text-[9px] text-white/30">
              Last: {getDayLabel(lastDefeat.gameDay)}
            </div>
          )}
          {captured && (
            <div className="flex items-center gap-1 text-[9px] mt-0.5">
              <PixelIcon icon="✦" size={14} variant="gold" />
              <span className="text-amber-400/70 font-medium">Captured</span>
            </div>
          )}
        </div>
      )}

      {!defeated && (
        <p className="text-[9px] text-white/15 italic">
          {type === 'lunar' ? 'Full moon nights' : 'New moon nights'}
        </p>
      )}
    </div>
  )
}

export default BossTrophyRoom
