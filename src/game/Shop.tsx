import { useState } from 'react'
import type { InventoryItem } from '@/types/game'
import { HELD_ITEM_LIST } from './heldItems'

interface ShopItem {
  item: InventoryItem
  price: number
  stock: number // -1 = unlimited
}

const SHOP_INVENTORY: ShopItem[] = [
  {
    item: { id: 'bio-capsule', name: 'Bio Capsule', type: 'capture', quantity: 1, description: 'A standard capture device for creatures.', sprite: '🔮' },
    price: 15,
    stock: -1,
  },
  {
    item: { id: 'golden-capsule', name: 'Golden Capsule', type: 'capture', quantity: 1, description: 'A premium capture device with higher success rate.', sprite: '✨' },
    price: 50,
    stock: -1,
  },
  {
    item: { id: 'herb-potion', name: 'Herb Potion', type: 'heal', quantity: 1, description: 'Restores 30 HP to one creature.', sprite: '🧪' },
    price: 10,
    stock: -1,
  },
  {
    item: { id: 'full-restore', name: 'Full Restore', type: 'heal', quantity: 1, description: 'Fully restores HP to one creature.', sprite: '💊' },
    price: 40,
    stock: -1,
  },
  {
    item: { id: 'energy-berry', name: 'Energy Berry', type: 'boost', quantity: 1, description: 'Boosts attack for the next battle.', sprite: '🫐' },
    price: 20,
    stock: -1,
  },
  {
    item: { id: 'shield-fern', name: 'Shield Fern', type: 'boost', quantity: 1, description: 'Boosts defense for the next battle.', sprite: '🌿' },
    price: 20,
    stock: -1,
  },
  // Held items — equipped on creatures for permanent stat boosts in battle
  ...HELD_ITEM_LIST.map(h => ({
    item: { id: h.id, name: h.name, type: 'held' as const, quantity: 1, description: h.description, sprite: h.sprite },
    price: h.price,
    stock: -1,
  })),
]

interface Props {
  coins: number
  inventory: InventoryItem[]
  onBuy: (item: InventoryItem, price: number, qty: number) => void
  onClose: () => void
}

export default function Shop({ coins, inventory, onBuy, onClose }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [buyQty, setBuyQty] = useState(1)
  const [flash, setFlash] = useState<string | null>(null)

  const selected = selectedIdx !== null ? SHOP_INVENTORY[selectedIdx] : null
  const totalPrice = selected ? selected.price * buyQty : 0
  const canAfford = coins >= totalPrice

  const handleBuy = () => {
    if (!selected || !canAfford) return
    onBuy({ ...selected.item, quantity: buyQty }, selected.price * buyQty, buyQty)
    setFlash(selected.item.name)
    setTimeout(() => setFlash(null), 800)
    setBuyQty(1)
  }

  const getOwnedCount = (itemId: string) => {
    const owned = inventory.find(i => i.id === itemId)
    return owned?.quantity ?? 0
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col" style={{
      background: 'linear-gradient(180deg, #0f1729 0%, #1a1f3a 100%)',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏪</span>
          <div>
            <h2 className="text-white font-bold text-sm">Bay Area Shop</h2>
            <p className="text-white/30 text-[9px]">Supplies for your expedition</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{
            background: 'rgba(234,179,8,0.1)',
            border: '1px solid rgba(234,179,8,0.2)',
          }}>
            <span className="text-xs">💰</span>
            <span className="text-yellow-400 text-xs font-bold">{coins}</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 text-xs px-2 py-1 rounded-lg transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Flash message */}
      {flash && (
        <div className="mx-4 mb-2 px-3 py-1.5 rounded-lg text-center text-xs font-medium text-green-300"
          style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}>
          Purchased {flash}!
        </div>
      )}

      {/* Item grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-2">
        <div className="grid grid-cols-2 gap-2">
          {SHOP_INVENTORY.map((shopItem, idx) => {
            const isSelected = selectedIdx === idx
            const owned = getOwnedCount(shopItem.item.id)
            return (
              <button
                key={shopItem.item.id}
                onClick={() => { setSelectedIdx(isSelected ? null : idx); setBuyQty(1) }}
                className="text-left rounded-xl p-3 transition-all"
                style={{
                  background: isSelected
                    ? 'rgba(56,189,248,0.1)'
                    : 'rgba(255,255,255,0.03)',
                  border: isSelected
                    ? '1px solid rgba(56,189,248,0.3)'
                    : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">{shopItem.item.sprite}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white/80 truncate">{shopItem.item.name}</p>
                    <p className="text-[9px] text-white/30 leading-tight mt-0.5">{shopItem.item.description}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] font-bold text-yellow-400">💰 {shopItem.price}</span>
                      {owned > 0 && (
                        <span className="text-[9px] text-white/25">Owned: {owned}</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Buy panel */}
      <div className="px-4 pb-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {selected ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{selected.item.sprite}</span>
                <span className="text-xs text-white/60 font-medium">{selected.item.name}</span>
              </div>
              {/* Quantity selector */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBuyQty(q => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-md text-sm text-white/50 hover:text-white/80 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  -
                </button>
                <span className="text-xs text-white/70 font-mono w-5 text-center">{buyQty}</span>
                <button
                  onClick={() => setBuyQty(q => Math.min(q + 1, Math.max(1, Math.floor(coins / selected.price))))}
                  className="w-8 h-8 rounded-md text-sm text-white/50 hover:text-white/80 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  +
                </button>
              </div>
            </div>
            <button
              onClick={handleBuy}
              disabled={!canAfford}
              className="w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: canAfford
                  ? 'linear-gradient(135deg, #059669, #047857)'
                  : 'rgba(255,255,255,0.05)',
                color: '#fff',
                boxShadow: canAfford ? '0 4px 12px rgba(5,150,105,0.3)' : 'none',
              }}
            >
              {canAfford
                ? `Buy ${buyQty}× for 💰 ${totalPrice}`
                : `Not enough coins (need 💰 ${totalPrice})`
              }
            </button>
          </div>
        ) : (
          <div className="text-center py-2.5">
            <p className="text-white/25 text-[10px]">Select an item to purchase</p>
          </div>
        )}
      </div>
    </div>
  )
}
