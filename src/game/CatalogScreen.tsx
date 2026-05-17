import { ALL_CREATURES } from './creatures'
import FloatingPanel from './FloatingPanel'
import PixelCreatureToken from './PixelCreatureToken'
import PixelIcon from './PixelIcon'

interface Props {
  catalogSeen: string[]
  catalogCaptured: string[]
  onClose: () => void
}

export default function CatalogScreen({ catalogSeen, catalogCaptured, onClose }: Props) {
  const rarityOrder = { legendary: 0, rare: 1, uncommon: 2, common: 3 }

  const sorted = [...ALL_CREATURES].sort((a, b) => {
    const aCapt = catalogCaptured.includes(a.id) ? 0 : catalogSeen.includes(a.id) ? 1 : 2
    const bCapt = catalogCaptured.includes(b.id) ? 0 : catalogSeen.includes(b.id) ? 1 : 2
    if (aCapt !== bCapt) return aCapt - bCapt
    return rarityOrder[a.rarity] - rarityOrder[b.rarity]
  })

  return (
    <FloatingPanel
      title="Species Catalog"
      subtitle={`${catalogCaptured.length} caught · ${catalogSeen.length} seen · ${ALL_CREATURES.length} total`}
      onClose={onClose}
      width="md"
    >
      {/* Progress bar */}
      <div className="px-4 py-2">
        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
            style={{ width: `${(catalogCaptured.length / ALL_CREATURES.length) * 100}%` }}
          />
        </div>
        <p className="text-[10px] text-white/30 mt-1">
          {Math.round((catalogCaptured.length / ALL_CREATURES.length) * 100)}% complete
        </p>
      </div>

      {/* Creature grid */}
      <div className="px-4 pb-3 space-y-2">
        {sorted.map(creature => {
          const seen = catalogSeen.includes(creature.id)
          const captured = catalogCaptured.includes(creature.id)

          const rarityColor = creature.rarity === 'legendary' ? '#c084fc' :
            creature.rarity === 'rare' ? '#fbbf24' :
            creature.rarity === 'uncommon' ? '#60a5fa' : '#9ca3af'

          return (
            <div
              key={creature.id}
              className="rounded-lg border p-2.5 transition-all"
              style={{
                background: captured ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.2)',
                borderColor: captured ? `${rarityColor}30` : 'rgba(255,255,255,0.05)',
                opacity: seen ? 1 : 0.4,
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: captured ? `${creature.color}15` : 'rgba(255,255,255,0.03)',
                  }}
                >
                  {seen ? <PixelCreatureToken creature={creature} size={28} selected={captured} /> : <span className="text-white/30 text-sm">?</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-xs font-semibold truncate">
                      {seen ? creature.name : '???'}
                    </span>
                    {seen && (
                      <span className="text-[8px] px-1 py-0.5 rounded-full font-medium shrink-0" style={{
                        background: `${rarityColor}15`,
                        color: rarityColor,
                        border: `1px solid ${rarityColor}30`,
                      }}>
                        {creature.rarity}
                      </span>
                    )}
                  </div>
                  {captured && (
                    <p className="text-white/40 text-[10px] mt-0.5 line-clamp-1">{creature.description}</p>
                  )}
                </div>
                <div className="shrink-0">
                  {captured ? (
                    <PixelIcon icon="✓" size={16} variant="nature" />
                  ) : seen ? (
                    <PixelIcon icon="👁" size={16} variant="gold" />
                  ) : (
                    <span className="text-white/20 text-[10px]">?</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </FloatingPanel>
  )
}
