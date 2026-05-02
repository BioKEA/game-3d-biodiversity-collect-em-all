import type { CreatureType } from '@/types/game'

const TYPES: CreatureType[] = ['beast', 'bird', 'insect', 'amphibian', 'marine', 'reptile', 'plant', 'mystic']

const TYPE_LABELS: Record<CreatureType, { name: string; icon: string; color: string }> = {
  beast:     { name: 'Beast',     icon: '🦊', color: '#f97316' },
  bird:      { name: 'Bird',      icon: '🦅', color: '#60a5fa' },
  insect:    { name: 'Insect',    icon: '🦋', color: '#eab308' },
  amphibian: { name: 'Amphibian', icon: '🐸', color: '#22c55e' },
  marine:    { name: 'Marine',    icon: '🦭', color: '#22d3ee' },
  reptile:   { name: 'Reptile',   icon: '🦎', color: '#facc15' },
  plant:     { name: 'Plant',     icon: '🌿', color: '#34d399' },
  mystic:    { name: 'Mystic',    icon: '✨', color: '#c084fc' },
}

// Matches encounterSystem.ts TYPE_CHART
const STRONG_AGAINST: Record<CreatureType, CreatureType[]> = {
  bird:      ['insect', 'reptile'],
  insect:    ['amphibian', 'plant'],
  amphibian: ['marine'],
  marine:    ['beast'],
  beast:     ['bird', 'plant'],
  reptile:   ['insect', 'amphibian'],
  plant:     ['marine'],
  mystic:    ['bird', 'insect', 'amphibian', 'marine', 'beast', 'reptile', 'plant'],
}

const WEAK_AGAINST: Record<CreatureType, CreatureType[]> = {
  bird:      ['beast'],
  insect:    ['bird', 'reptile'],
  amphibian: ['insect', 'reptile'],
  marine:    ['amphibian', 'plant'],
  beast:     ['marine'],
  reptile:   ['bird'],
  plant:     ['insect', 'beast'],
  mystic:    ['mystic'],
}

function getMatchup(attacker: CreatureType, defender: CreatureType): 'strong' | 'weak' | 'neutral' {
  if (STRONG_AGAINST[attacker]?.includes(defender)) return 'strong'
  if (WEAK_AGAINST[attacker]?.includes(defender)) return 'weak'
  return 'neutral'
}

interface Props {
  highlightType?: CreatureType
}

export default function TypeChart({ highlightType }: Props) {
  return (
    <div>
      <h4 className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2">Type Matchups</h4>

      {/* Quick reference for highlighted type */}
      {highlightType && (
        <div className="mb-3 rounded-lg p-2" style={{
          background: `${TYPE_LABELS[highlightType].color}08`,
          border: `1px solid ${TYPE_LABELS[highlightType].color}20`,
        }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm">{TYPE_LABELS[highlightType].icon}</span>
            <span className="text-white text-[10px] font-semibold">{TYPE_LABELS[highlightType].name}</span>
          </div>
          <div className="flex gap-3 text-[9px]">
            <div>
              <span className="text-white/30">Strong vs: </span>
              {STRONG_AGAINST[highlightType]?.map(t => (
                <span key={t} className="text-emerald-400 mr-1">
                  {TYPE_LABELS[t].icon}{TYPE_LABELS[t].name}
                </span>
              ))}
            </div>
            <div>
              <span className="text-white/30">Weak vs: </span>
              {WEAK_AGAINST[highlightType]?.map(t => (
                <span key={t} className="text-red-400 mr-1">
                  {TYPE_LABELS[t].icon}{TYPE_LABELS[t].name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Full grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-center">
          <thead>
            <tr>
              <th className="text-[7px] text-white/20 p-0.5 w-10">ATK↓ DEF→</th>
              {TYPES.map(t => (
                <th key={t} className="p-0.5">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs">{TYPE_LABELS[t].icon}</span>
                    <span className="text-[6px] text-white/30">{TYPE_LABELS[t].name.slice(0, 3)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TYPES.map(attacker => (
              <tr key={attacker} className={highlightType === attacker ? 'bg-white/5' : ''}>
                <td className="p-0.5 text-center">
                  <div className="flex items-center gap-0.5 justify-center">
                    <span className="text-xs">{TYPE_LABELS[attacker].icon}</span>
                    <span className="text-[6px] text-white/30">{TYPE_LABELS[attacker].name.slice(0, 3)}</span>
                  </div>
                </td>
                {TYPES.map(defender => {
                  const matchup = getMatchup(attacker, defender)
                  const isHighlighted = highlightType === attacker || highlightType === defender
                  return (
                    <td key={defender} className="p-0.5">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold mx-auto"
                        style={{
                          background: matchup === 'strong' ? 'rgba(34,197,94,0.2)'
                            : matchup === 'weak' ? 'rgba(239,68,68,0.2)'
                            : 'rgba(255,255,255,0.03)',
                          border: isHighlighted
                            ? `1px solid ${matchup === 'strong' ? 'rgba(34,197,94,0.4)' : matchup === 'weak' ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`
                            : '1px solid transparent',
                          color: matchup === 'strong' ? '#4ade80'
                            : matchup === 'weak' ? '#f87171'
                            : 'rgba(255,255,255,0.15)',
                        }}
                      >
                        {matchup === 'strong' ? '2×' : matchup === 'weak' ? '½' : '—'}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-2">
        <span className="flex items-center gap-1 text-[8px] text-emerald-400">
          <span className="w-2 h-2 rounded-sm bg-emerald-500/30" /> Super effective (1.5×)
        </span>
        <span className="flex items-center gap-1 text-[8px] text-red-400">
          <span className="w-2 h-2 rounded-sm bg-red-500/30" /> Not effective (0.65×)
        </span>
        <span className="flex items-center gap-1 text-[8px] text-white/30">
          <span className="w-2 h-2 rounded-sm bg-white/5" /> Normal (1×)
        </span>
      </div>
    </div>
  )
}

// Compact badge for battle screen showing type advantage
export function TypeMatchupBadge({ attackerType, defenderType }: { attackerType: CreatureType; defenderType: CreatureType }) {
  const matchup = getMatchup(attackerType, defenderType)
  if (matchup === 'neutral') return null

  return (
    <span
      className="text-[8px] px-1.5 py-0.5 rounded-full font-medium"
      style={{
        background: matchup === 'strong' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
        color: matchup === 'strong' ? '#4ade80' : '#f87171',
        border: `1px solid ${matchup === 'strong' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
      }}
    >
      {matchup === 'strong' ? '▲ Strong' : '▼ Weak'}
    </span>
  )
}
