// Heal-item lookup table. Pure data: which consumable heals how much.
// Shared by the Team screen (display) and features/team/logic.ts (state).
export function getHealAmount(itemId: string): { hp: number; fullHeal: boolean } {
  switch (itemId) {
    case 'herb-potion': return { hp: 30, fullHeal: false }
    case 'kelp-wrap': return { hp: 40, fullHeal: false }
    case 'super-potion': return { hp: 80, fullHeal: false }
    case 'max-potion': return { hp: 0, fullHeal: true }
    case 'full-restore': return { hp: 0, fullHeal: true }
    case 'mystic-elixir': return { hp: 0, fullHeal: true }
    case 'cotton-candy': return { hp: 15, fullHeal: false }
    case 'boardwalk-funnel-cake': return { hp: 30, fullHeal: false }
    default: return { hp: 25, fullHeal: false }
  }
}
