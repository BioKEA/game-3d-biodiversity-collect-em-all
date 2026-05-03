// Passive abilities — each creature species has one. Triggers automatically in battle.
export interface Ability {
  id: string
  name: string
  description: string
  trigger: 'battle_start' | 'on_attack' | 'on_defend' | 'on_low_hp' | 'always'
  effect: AbilityEffect
}

export type AbilityEffect =
  | { type: 'stat_boost'; stat: 'attack' | 'defense' | 'speed'; amount: number }
  | { type: 'damage_boost'; multiplier: number }
  | { type: 'damage_reduce'; multiplier: number }
  | { type: 'heal'; percent: number }
  | { type: 'dodge_chance'; percent: number }
  | { type: 'status_immune' }
  | { type: 'crit_boost'; percent: number }

// Map creature ID to their passive ability
const ABILITY_MAP: Record<string, Ability> = {
  'red-tailed-hawk': {
    id: 'keen-eye', name: 'Keen Eye',
    description: '+15% crit chance from aerial precision',
    trigger: 'on_attack', effect: { type: 'crit_boost', percent: 15 },
  },
  'california-newt': {
    id: 'toxic-skin', name: 'Toxic Skin',
    description: 'Immune to poison status effects',
    trigger: 'always', effect: { type: 'status_immune' },
  },
  'mission-blue-butterfly': {
    id: 'lupine-bond', name: 'Lupine Bond',
    description: '+3 speed from hillside agility',
    trigger: 'battle_start', effect: { type: 'stat_boost', stat: 'speed', amount: 3 },
  },
  'monarch-butterfly': {
    id: 'migration-speed', name: 'Migration Speed',
    description: '+3 speed from migratory instincts',
    trigger: 'battle_start', effect: { type: 'stat_boost', stat: 'speed', amount: 3 },
  },
  'harbor-seal': {
    id: 'blubber-armor', name: 'Blubber Armor',
    description: 'Takes 15% less damage from all attacks',
    trigger: 'on_defend', effect: { type: 'damage_reduce', multiplier: 0.85 },
  },
  'gray-fox': {
    id: 'night-hunter', name: 'Night Hunter',
    description: '+20% attack power during dusk and night',
    trigger: 'on_attack', effect: { type: 'damage_boost', multiplier: 1.2 },
  },
  'banana-slug': {
    id: 'slime-trail', name: 'Slime Trail',
    description: '10% chance to dodge attacks by sliding away',
    trigger: 'on_defend', effect: { type: 'dodge_chance', percent: 10 },
  },
  'great-blue-heron': {
    id: 'patience', name: 'Patience',
    description: '+4 attack from waiting for the perfect strike',
    trigger: 'battle_start', effect: { type: 'stat_boost', stat: 'attack', amount: 4 },
  },
  'coyote': {
    id: 'pack-tactics', name: 'Pack Tactics',
    description: '+20% damage — cunning pack coordination',
    trigger: 'on_attack', effect: { type: 'damage_boost', multiplier: 1.2 },
  },
  'pacific-tree-frog': {
    id: 'chorus-shield', name: 'Chorus Shield',
    description: '+3 defense from group chorus intimidation',
    trigger: 'battle_start', effect: { type: 'stat_boost', stat: 'defense', amount: 3 },
  },
  'western-fence-lizard': {
    id: 'lyme-cleanse', name: 'Lyme Cleanse',
    description: 'Immune to all status effects',
    trigger: 'always', effect: { type: 'status_immune' },
  },
  'fog-serpent': {
    id: 'fog-veil', name: 'Fog Veil',
    description: '15% chance to dodge via fog concealment',
    trigger: 'on_defend', effect: { type: 'dodge_chance', percent: 15 },
  },
  'crystal-fox': {
    id: 'prismatic-refract', name: 'Prismatic Refract',
    description: 'Takes 20% less damage from light refraction',
    trigger: 'on_defend', effect: { type: 'damage_reduce', multiplier: 0.8 },
  },
  'ember-salamander': {
    id: 'geothermal-surge', name: 'Geothermal Surge',
    description: 'Heals 10% HP when below 30% health',
    trigger: 'on_low_hp', effect: { type: 'heal', percent: 10 },
  },
  'tide-phantom': {
    id: 'phase-shift', name: 'Tidal Phase',
    description: '20% dodge chance — shifts between states of matter',
    trigger: 'on_defend', effect: { type: 'dodge_chance', percent: 20 },
  },
  'redwood-guardian': {
    id: 'ancient-bark', name: 'Ancient Bark',
    description: '+6 defense from millennia-old bark armor',
    trigger: 'battle_start', effect: { type: 'stat_boost', stat: 'defense', amount: 6 },
  },
  'bay-wisp': {
    id: 'luminous-aura', name: 'Luminous Aura',
    description: '+25% crit chance from unpredictable energy',
    trigger: 'on_attack', effect: { type: 'crit_boost', percent: 25 },
  },
  'raccoon': {
    id: 'scavenger', name: 'Scavenger',
    description: 'Heals 8% HP when low — finds scraps to recover',
    trigger: 'on_low_hp', effect: { type: 'heal', percent: 8 },
  },
  'black-tailed-deer': {
    id: 'fleet-foot', name: 'Fleet Foot',
    description: '+5 speed from nimble hooves',
    trigger: 'battle_start', effect: { type: 'stat_boost', stat: 'speed', amount: 5 },
  },
  'brown-pelican': {
    id: 'plunge-dive', name: 'Plunge Dive',
    description: '+15% damage from dive-bombing attacks',
    trigger: 'on_attack', effect: { type: 'damage_boost', multiplier: 1.15 },
  },
  'gopher-snake': {
    id: 'intimidate', name: 'Intimidate',
    description: 'Enemy loses 3 attack — mistaken for a rattlesnake',
    trigger: 'battle_start', effect: { type: 'stat_boost', stat: 'attack', amount: -3 },
  },
  'river-otter': {
    id: 'playful-spirit', name: 'Playful Spirit',
    description: '12% dodge chance — too playful to hit',
    trigger: 'on_defend', effect: { type: 'dodge_chance', percent: 12 },
  },
  'scrub-jay': {
    id: 'food-cache', name: 'Food Cache',
    description: 'Heals 12% HP when low from hidden acorn stash',
    trigger: 'on_low_hp', effect: { type: 'heal', percent: 12 },
  },
  'bobcat': {
    id: 'ambush-predator', name: 'Ambush Predator',
    description: '+25% damage on first attack of battle',
    trigger: 'on_attack', effect: { type: 'damage_boost', multiplier: 1.25 },
  },
  'silicon-sprite': {
    id: 'overclock', name: 'Overclock',
    description: '+4 speed from processing power surge',
    trigger: 'battle_start', effect: { type: 'stat_boost', stat: 'speed', amount: 4 },
  },
  'golden-eagle': {
    id: 'apex-predator', name: 'Apex Predator',
    description: '+20% crit chance — the king of Bay skies',
    trigger: 'on_attack', effect: { type: 'crit_boost', percent: 20 },
  },
  'mission-phantom': {
    id: 'spectral-form', name: 'Spectral Form',
    description: '18% dodge chance — partially intangible',
    trigger: 'on_defend', effect: { type: 'dodge_chance', percent: 18 },
  },
  // Alcatraz creatures
  'phantom-crab': {
    id: 'phase-walk', name: 'Phase Walk',
    description: '12% dodge chance — phases through solid rock',
    trigger: 'on_defend', effect: { type: 'dodge_chance', percent: 12 },
  },
  'cell-block-specter': {
    id: 'chain-rattle', name: 'Chain Rattle',
    description: '+5 attack from terrifying phantom chains',
    trigger: 'battle_start', effect: { type: 'stat_boost', stat: 'attack', amount: 5 },
  },
  'rock-wraith': {
    id: 'stone-armor', name: 'Stone Armor',
    description: 'Takes 20% less damage from ancient stone body',
    trigger: 'on_defend', effect: { type: 'damage_reduce', multiplier: 0.8 },
  },
  'warden-of-the-rock': {
    id: 'tidal-authority', name: 'Tidal Authority',
    description: '+25% damage — commands the Bay itself',
    trigger: 'on_attack', effect: { type: 'damage_boost', multiplier: 1.25 },
  },
  'alcatraz-night-heron': {
    id: 'wardens-gaze', name: 'Warden\'s Gaze',
    description: '+15% crit chance from piercing, luminous eyes',
    trigger: 'on_attack', effect: { type: 'crit_boost', percent: 15 },
  },
  'fog-gull': {
    id: 'mist-cloak', name: 'Mist Cloak',
    description: '15% dodge chance — wreathed in eternal fog',
    trigger: 'on_defend', effect: { type: 'dodge_chance', percent: 15 },
  },
  // Nocturnal creatures
  'nightjar': {
    id: 'silent-flight', name: 'Silent Flight',
    description: '+3 speed from completely silent wingbeats',
    trigger: 'battle_start', effect: { type: 'stat_boost', stat: 'speed', amount: 3 },
  },
  'bay-firefly': {
    id: 'bioluminescence', name: 'Bioluminescence',
    description: '10% dodge chance from confusing light patterns',
    trigger: 'on_defend', effect: { type: 'dodge_chance', percent: 10 },
  },
  'midnight-coyote': {
    id: 'howl', name: 'Midnight Howl',
    description: '+4 attack from a bone-chilling howl',
    trigger: 'battle_start', effect: { type: 'stat_boost', stat: 'attack', amount: 4 },
  },
  'ghost-moth': {
    id: 'ethereal-scales', name: 'Ethereal Scales',
    description: 'Takes 15% less damage from luminescent wing scales',
    trigger: 'on_defend', effect: { type: 'damage_reduce', multiplier: 0.85 },
  },
  // Other creatures missing abilities
  'sea-lion': {
    id: 'bark-command', name: 'Bark Command',
    description: '+3 defense from assertive barking',
    trigger: 'battle_start', effect: { type: 'stat_boost', stat: 'defense', amount: 3 },
  },
  'mountain-lion': {
    id: 'apex-ambush', name: 'Apex Ambush',
    description: '+20% crit chance — silent stalker',
    trigger: 'on_attack', effect: { type: 'crit_boost', percent: 20 },
  },
  'tule-elk': {
    id: 'antler-guard', name: 'Antler Guard',
    description: '+5 defense from massive antlers',
    trigger: 'battle_start', effect: { type: 'stat_boost', stat: 'defense', amount: 5 },
  },
  'giant-salamander': {
    id: 'regeneration', name: 'Regeneration',
    description: 'Heals 15% HP when below 30% — ancient healing',
    trigger: 'on_low_hp', effect: { type: 'heal', percent: 15 },
  },
  'california-condor': {
    id: 'soaring-majesty', name: 'Soaring Majesty',
    description: '+5 speed from enormous wingspan',
    trigger: 'battle_start', effect: { type: 'stat_boost', stat: 'speed', amount: 5 },
  },
  'sandhill-crane': {
    id: 'ancient-dance', name: 'Ancient Dance',
    description: '+3 attack from ritualistic war dance',
    trigger: 'battle_start', effect: { type: 'stat_boost', stat: 'attack', amount: 3 },
  },
  'painted-lady-swarm': {
    id: 'swarm-tactics', name: 'Swarm Tactics',
    description: '15% dodge chance — hard to hit a moving swarm',
    trigger: 'on_defend', effect: { type: 'dodge_chance', percent: 15 },
  },
  'ancient-gastropod': {
    id: 'indestructible-shell', name: 'Indestructible Shell',
    description: 'Takes 25% less damage from impenetrable shell',
    trigger: 'on_defend', effect: { type: 'damage_reduce', multiplier: 0.75 },
  },
  'western-screech-owl': {
    id: 'night-vision', name: 'Night Vision',
    description: '+20% crit from perfect night sight',
    trigger: 'on_attack', effect: { type: 'crit_boost', percent: 20 },
  },
}

export function getAbility(creatureId: string): Ability | null {
  return ABILITY_MAP[creatureId] ?? null
}

/** Teachable abilities sold at the Move Tutor. These override a creature's species ability when learned. */
export interface TeachableAbility extends Ability {
  price: number
  sprite: string
}

export const TEACHABLE_ABILITIES: Record<string, TeachableAbility> = {
  'focus-strike': {
    id: 'focus-strike', name: 'Focus Strike',
    description: '+15% crit chance on every attack',
    trigger: 'on_attack', effect: { type: 'crit_boost', percent: 15 },
    price: 800, sprite: '🎯',
  },
  'iron-will': {
    id: 'iron-will', name: 'Iron Will',
    description: '+5 defense at the start of battle',
    trigger: 'battle_start', effect: { type: 'stat_boost', stat: 'defense', amount: 5 },
    price: 600, sprite: '🛡️',
  },
  'thunder-fury': {
    id: 'thunder-fury', name: 'Thunder Fury',
    description: '+20% damage on every attack',
    trigger: 'on_attack', effect: { type: 'damage_boost', multiplier: 1.2 },
    price: 1200, sprite: '⚡',
  },
  'mending-light': {
    id: 'mending-light', name: 'Mending Light',
    description: 'Heal 15% HP when below 30% health',
    trigger: 'on_low_hp', effect: { type: 'heal', percent: 15 },
    price: 1000, sprite: '✨',
  },
  'wind-dancer': {
    id: 'wind-dancer', name: 'Wind Dancer',
    description: '15% chance to dodge any incoming attack',
    trigger: 'on_defend', effect: { type: 'dodge_chance', percent: 15 },
    price: 1100, sprite: '🌪️',
  },
  'status-guard': {
    id: 'status-guard', name: 'Status Guard',
    description: 'Immune to all status effects',
    trigger: 'always', effect: { type: 'status_immune' },
    price: 900, sprite: '💠',
  },
}

export const TEACHABLE_ABILITY_LIST: TeachableAbility[] = Object.values(TEACHABLE_ABILITIES)

/** Accepts either a species ID string or a creature object that may have a learnedAbility override. */
export type AbilitySource = string | { id: string; learnedAbility?: string }

function resolveAbility(src: AbilitySource): Ability | null {
  if (typeof src === 'string') return ABILITY_MAP[src] ?? null
  if (src.learnedAbility) {
    const learned = TEACHABLE_ABILITIES[src.learnedAbility]
    if (learned) return learned
  }
  return ABILITY_MAP[src.id] ?? null
}

/** Returns the ability a creature will actually use — learned override wins over species default. */
export function getEffectiveAbility(creature: { id: string; learnedAbility?: string }): Ability | null {
  return resolveAbility(creature)
}

/** Apply battle_start abilities — modify stats in place before fight begins */
export function applyBattleStartAbility(
  source: AbilitySource,
  stats: { attack: number; defense: number; speed: number }
): { ability: Ability; applied: boolean } | null {
  const ability = resolveAbility(source)
  if (!ability || ability.trigger !== 'battle_start') return null

  if (ability.effect.type === 'stat_boost') {
    const { stat, amount } = ability.effect
    stats[stat] = Math.max(1, stats[stat] + amount)
    return { ability, applied: true }
  }
  return { ability, applied: false }
}

/** Check if an attack should crit based on ability */
export function rollAbilityCrit(source: AbilitySource): boolean {
  const ability = resolveAbility(source)
  if (!ability) return false
  if (ability.trigger === 'on_attack' && ability.effect.type === 'crit_boost') {
    return Math.random() * 100 < ability.effect.percent
  }
  return false
}

/** Apply damage modifier from ability */
export function getAbilityDamageMultiplier(source: AbilitySource, isAttacker: boolean): number {
  const ability = resolveAbility(source)
  if (!ability) return 1

  if (isAttacker && ability.trigger === 'on_attack' && ability.effect.type === 'damage_boost') {
    return ability.effect.multiplier
  }
  if (!isAttacker && ability.trigger === 'on_defend' && ability.effect.type === 'damage_reduce') {
    return ability.effect.multiplier
  }
  return 1
}

/** Check if ability grants a dodge */
export function rollAbilityDodge(source: AbilitySource): boolean {
  const ability = resolveAbility(source)
  if (!ability) return false
  if (ability.trigger === 'on_defend' && ability.effect.type === 'dodge_chance') {
    return Math.random() * 100 < ability.effect.percent
  }
  return false
}

/** Check if ability grants status immunity */
export function hasStatusImmunity(source: AbilitySource): boolean {
  const ability = resolveAbility(source)
  if (!ability) return false
  return ability.effect.type === 'status_immune'
}

/** Trigger low-HP heal ability — returns HP healed or 0 */
export function triggerLowHpHeal(source: AbilitySource, currentHp: number, maxHp: number): number {
  const ability = resolveAbility(source)
  if (!ability) return 0
  if (ability.trigger === 'on_low_hp' && ability.effect.type === 'heal') {
    if (currentHp <= maxHp * 0.3) {
      return Math.floor(maxHp * (ability.effect.percent / 100))
    }
  }
  return 0
}
