import { useState, useMemo } from 'react'
import type { BiomeType, PlayerState } from '@/types/game'
import { ALL_CREATURES } from './creatures'
import { BIOME_FIELD_NOTES, getBiomeCatchSpeciesCount, getTotalProgress } from './biomeFieldNotes'
import FloatingPanel from './FloatingPanel'
import PixelIcon from './PixelIcon'

interface Props {
  player: PlayerState
  onClose: () => void
}

export default function BiomeFieldNotesPanel({ player, onClose }: Props) {
  const creatureLookup = useMemo(() => {
    const m = new Map<string, { biomes: BiomeType[] }>()
    for (const c of ALL_CREATURES) m.set(c.id, { biomes: c.biomes })
    return m
  }, [])

  const biomeOrder = useMemo(() => Object.keys(BIOME_FIELD_NOTES) as BiomeType[], [])
  const [selected, setSelected] = useState<BiomeType>(biomeOrder[0])

  const totalProgress = getTotalProgress(player.captured, creatureLookup)
  const currentBiome = BIOME_FIELD_NOTES[selected]
  const currentCount = getBiomeCatchSpeciesCount(selected, player.captured, creatureLookup)

  return (
    <FloatingPanel
      title="Biome Field Notes"
      subtitle={`${totalProgress.unlocked}/${totalProgress.total} ecological insights unlocked`}
      onClose={onClose}
      width="md"
    >
      <div className="p-3 space-y-3">
        {/* Biome tab grid */}
        <div className="grid grid-cols-4 gap-1.5">
          {biomeOrder.map(biome => {
            const bn = BIOME_FIELD_NOTES[biome]
            const count = getBiomeCatchSpeciesCount(biome, player.captured, creatureLookup)
            const unlockedHere = bn.notes.filter(n => count >= n.threshold).length
            const isSelected = biome === selected
            return (
              <button
                key={biome}
                onClick={() => setSelected(biome)}
                className="flex flex-col items-center gap-0.5 py-2 rounded-lg transition-all"
                style={{
                  background: isSelected ? `${bn.color}22` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? `${bn.color}66` : 'rgba(255,255,255,0.04)'}`,
                }}
              >
                <span className="text-base">{bn.icon}</span>
                <span
                  className="text-[8px] uppercase tracking-wider font-semibold truncate w-full text-center px-1"
                  style={{ color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.5)' }}
                >
                  {bn.label}
                </span>
                <span className="text-[8px]" style={{ color: isSelected ? bn.color : 'rgba(255,255,255,0.3)' }}>
                  {unlockedHere}/{bn.notes.length}
                </span>
              </button>
            )
          })}
        </div>

        {/* Current biome header */}
        <div
          className="rounded-lg p-3"
          style={{
            background: `linear-gradient(135deg, ${currentBiome.color}15 0%, ${currentBiome.color}05 100%)`,
            border: `1px solid ${currentBiome.color}33`,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{currentBiome.icon}</span>
            <h3 className="text-white text-sm font-bold">{currentBiome.label}</h3>
          </div>
          <p className="text-white/50 text-[10px]">
            {currentCount} {currentCount === 1 ? 'species' : 'species'} documented · catch more to unlock notes
          </p>
        </div>

        {/* Notes list */}
        <div className="space-y-2">
          {currentBiome.notes.map((note, i) => {
            const unlocked = currentCount >= note.threshold
            return (
              <div
                key={i}
                className="rounded-lg p-3 transition-all"
                style={{
                  background: unlocked ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
                  border: `1px solid ${unlocked ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'}`,
                  opacity: unlocked ? 1 : 0.55,
                }}
              >
                {unlocked ? (
                  <>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px]"
                        style={{
                          background: `${currentBiome.color}33`,
                          border: `1px solid ${currentBiome.color}66`,
                          color: currentBiome.color,
                        }}
                      >
                        {i + 1}
                      </div>
                      <h4 className="text-white text-xs font-semibold">{note.title}</h4>
                    </div>
                    <p className="text-white/60 text-[10px] leading-relaxed italic pl-7">{note.text}</p>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <PixelIcon icon="🔒" size={16} variant="neutral" />
                    <span className="text-white/30 text-[10px]">
                      Locked · catch {note.threshold} {note.threshold === 1 ? 'species' : 'species'} from this biome
                    </span>
                    <div className="ml-auto text-white/30 text-[9px] font-mono">
                      {currentCount}/{note.threshold}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </FloatingPanel>
  )
}
