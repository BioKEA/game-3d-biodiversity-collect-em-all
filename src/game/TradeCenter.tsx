import { useState } from 'react'
import type { CapturedCreature } from '@/types/game'
import { encodeCreature, decodeCreature, isDecodeError } from './tradeCode'
import FloatingPanel from './FloatingPanel'

interface Props {
  team: CapturedCreature[]
  onClose: () => void
  onImportCreature: (creature: CapturedCreature) => void
  onRemoveCreature: (index: number) => void
}

type Tab = 'export' | 'import'

const RARITY_COLORS: Record<string, string> = {
  common: 'text-white/50',
  uncommon: 'text-blue-400',
  rare: 'text-purple-400',
  legendary: 'text-yellow-400',
}

export default function TradeCenter({ team, onClose, onImportCreature, onRemoveCreature }: Props) {
  const [tab, setTab] = useState<Tab>('export')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [importCode, setImportCode] = useState('')
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; creature?: CapturedCreature } | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmExport, setConfirmExport] = useState(false)

  const handleGenerateCode = () => {
    if (selectedIndex === null) return
    const creature = team[selectedIndex]
    if (!creature) return
    setConfirmExport(true)
  }

  const handleConfirmExport = () => {
    if (selectedIndex === null) return
    const creature = team[selectedIndex]
    if (!creature) return
    const code = encodeCreature(creature)
    setGeneratedCode(code)
    setConfirmExport(false)
    // Remove creature from team after generating code
    onRemoveCreature(selectedIndex)
    setSelectedIndex(null)
  }

  const handleCopy = async () => {
    if (!generatedCode) return
    try {
      await navigator.clipboard.writeText(generatedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select the text
      const input = document.querySelector<HTMLInputElement>('#trade-code-output')
      if (input) {
        input.select()
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const handleImport = () => {
    if (!importCode.trim()) return
    const result = decodeCreature(importCode)
    if (isDecodeError(result)) {
      setImportResult({ success: false, message: result.error })
    } else {
      if (team.length >= 6) {
        setImportResult({ success: false, message: 'Your team is full (6/6). Release a creature first.' })
        return
      }
      setImportResult({ success: true, message: `${result.name} (Lv.${result.level}) joined your team!`, creature: result })
      onImportCreature(result)
      setImportCode('')
    }
  }

  return (
    <FloatingPanel
      title="Trade Center"
      subtitle="Share creatures with friends"
      onClose={onClose}
      width="md"
    >

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => { setTab('export'); setImportResult(null) }}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            tab === 'export'
              ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          📤 Send Creature
        </button>
        <button
          onClick={() => { setTab('import'); setGeneratedCode(null); setConfirmExport(false) }}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            tab === 'import'
              ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          📥 Receive Creature
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'export' && (
          <div className="space-y-3">
            {/* Instructions */}
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-2.5">
              <p className="text-amber-300/70 text-[10px] leading-relaxed">
                Select a creature to generate a trade code. Share the code with a friend — they paste it to receive the creature.
                <span className="text-amber-400 font-medium"> The creature leaves your team when you generate the code.</span>
              </p>
            </div>

            {generatedCode ? (
              /* Generated code display */
              <div className="space-y-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                  <p className="text-emerald-400 text-xs font-medium mb-2">Trade code generated!</p>
                  <input
                    id="trade-code-output"
                    type="text"
                    readOnly
                    value={generatedCode}
                    className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white text-xs font-mono text-center select-all"
                  />
                  <button
                    onClick={handleCopy}
                    className="mt-2 px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                  >
                    {copied ? '✓ Copied!' : '📋 Copy Code'}
                  </button>
                  <p className="text-white/30 text-[9px] mt-2">Send this code to your friend</p>
                </div>
                <button
                  onClick={() => { setGeneratedCode(null); setSelectedIndex(null) }}
                  className="w-full py-2 rounded-md bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 transition-colors"
                >
                  Send Another
                </button>
              </div>
            ) : confirmExport && selectedIndex !== null ? (
              /* Confirmation */
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-300 text-xs font-medium mb-1">Confirm Trade</p>
                <p className="text-white/50 text-[10px] mb-3">
                  <span className="text-lg">{team[selectedIndex]?.sprite}</span>{' '}
                  <strong className="text-white/70">{team[selectedIndex]?.nickname || team[selectedIndex]?.name}</strong>{' '}
                  (Lv.{team[selectedIndex]?.level}) will be removed from your team.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmExport}
                    className="flex-1 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors"
                  >
                    Confirm & Generate Code
                  </button>
                  <button
                    onClick={() => setConfirmExport(false)}
                    className="flex-1 py-1.5 rounded-md bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Creature selection */
              <>
                <p className="text-white/30 text-[10px] uppercase tracking-wider">Select a creature to send</p>
                {team.length <= 1 ? (
                  <div className="bg-white/3 rounded-lg p-4 text-center">
                    <p className="text-white/30 text-xs">You need at least 2 creatures to trade. Your last creature can't be traded.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {team.map((creature, idx) => {
                      const isLast = team.length === 1
                      const isLeadOnly = idx === 0 && team.length <= 1
                      const disabled = isLast || isLeadOnly
                      const isSelected = selectedIndex === idx

                      return (
                        <button
                          key={`${creature.id}-${idx}`}
                          onClick={() => !disabled && setSelectedIndex(isSelected ? null : idx)}
                          disabled={disabled}
                          className={`w-full text-left rounded-lg p-2.5 transition-all ${
                            isSelected
                              ? 'bg-amber-500/15 border border-amber-500/30'
                              : disabled
                                ? 'bg-white/2 border border-transparent opacity-40 cursor-not-allowed'
                                : 'bg-white/3 border border-transparent hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{creature.sprite}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-white text-xs font-semibold truncate">
                                  {creature.nickname || creature.name}
                                </span>
                                <span className="text-white/30 text-[10px]">Lv.{creature.level}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[9px] ${RARITY_COLORS[creature.rarity] ?? 'text-white/30'}`}>
                                  {creature.rarity}
                                </span>
                                <span className="text-white/20 text-[9px]">·</span>
                                <span className="text-white/30 text-[9px]">{creature.type}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-white/30">
                                HP {creature.stats.hp}/{creature.stats.maxHp}
                              </p>
                              <p className="text-[9px] text-white/20">
                                ATK {creature.stats.attack} · DEF {creature.stats.defense}
                              </p>
                            </div>
                            {idx === 0 && team.length > 1 && (
                              <span className="text-[8px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded-full">LEAD</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {selectedIndex !== null && (
                  <button
                    onClick={handleGenerateCode}
                    className="w-full py-2 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
                  >
                    Generate Trade Code
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'import' && (
          <div className="space-y-3">
            {/* Instructions */}
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-2.5">
              <p className="text-emerald-300/70 text-[10px] leading-relaxed">
                Paste a trade code from a friend to receive their creature. The creature joins your team if you have space (max 6).
              </p>
            </div>

            {/* Code input */}
            <div>
              <label className="text-white/30 text-[10px] uppercase tracking-wider block mb-1">Trade Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={importCode}
                  onChange={e => { setImportCode(e.target.value); setImportResult(null) }}
                  placeholder="BQ-eyJpIjoic..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white text-xs font-mono placeholder:text-white/15 focus:border-emerald-500/40 focus:outline-none"
                />
                <button
                  onClick={handleImport}
                  disabled={!importCode.trim()}
                  className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                    importCode.trim()
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-white/5 text-white/20 cursor-not-allowed'
                  }`}
                >
                  Import
                </button>
              </div>
            </div>

            {/* Result */}
            {importResult && (
              <div className={`rounded-lg p-3 border ${
                importResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                {importResult.success && importResult.creature ? (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{importResult.creature.sprite}</span>
                    <div>
                      <p className="text-emerald-300 text-xs font-medium">{importResult.message}</p>
                      <p className="text-white/30 text-[9px] mt-0.5">
                        {importResult.creature.rarity} {importResult.creature.type} · {importResult.creature.scientificName}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-300 text-xs">{importResult.message}</p>
                )}
              </div>
            )}

            {/* Team preview */}
            <div>
              <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">
                Your Team ({team.length}/6)
              </p>
              <div className="flex gap-1.5">
                {Array.from({ length: 6 }).map((_, i) => {
                  const c = team[i]
                  return (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        c ? 'bg-white/5 border border-white/10' : 'bg-white/2 border border-dashed border-white/5'
                      }`}
                    >
                      {c ? (
                        <span className="text-lg" title={`${c.nickname || c.name} Lv.${c.level}`}>{c.sprite}</span>
                      ) : (
                        <span className="text-white/10 text-[10px]">+</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </FloatingPanel>
  )
}
