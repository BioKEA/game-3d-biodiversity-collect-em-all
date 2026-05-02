export type BiomeType = 'forest' | 'marsh' | 'beach' | 'rocky_beach' | 'urban' | 'water' | 'mountain' | 'grassland' | 'redwood' | 'tidepool' | 'chaparral' | 'oak_woodland' | 'kelp_forest' | 'desert' | 'alpine' | 'snow' | 'valley' | 'volcanic' | 'scrubland' | 'dunes' | 'canyon' | 'lakeshore' | 'old_growth'

export type CreatureRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export type CreatureType = 'beast' | 'bird' | 'insect' | 'marine' | 'amphibian' | 'mystic' | 'reptile' | 'plant'

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night'

export type WeatherType = 'clear' | 'fog' | 'rain' | 'wind' | 'sunny' | 'thunderstorm'

export type Season = 'winter' | 'spring' | 'summer' | 'fall'

// IUCN-style conservation status. 'fantasy' for invented/mystic species, 'INV' for invasive, 'NA' for naturalized non-native.
export type ConservationStatus = 'LC' | 'NT' | 'VU' | 'EN' | 'CR' | 'EX' | 'INV' | 'NA' | 'fantasy'

export interface CreatureStats {
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
}

export interface Creature {
  id: string
  name: string
  scientificName: string
  description: string
  type: CreatureType
  rarity: CreatureRarity
  biomes: BiomeType[]
  subregions: string[] // specific subregions where this creature appears
  stats: CreatureStats
  isFantasy: boolean
  sprite: string
  color: string
  moves: Move[]
  activeTime?: TimeOfDay[] // when this creature appears (empty = all times)
  activeWeather?: WeatherType[] // weather conditions when this creature appears
  lore?: string // extended lore for BayDex
  isAlpha?: boolean
  isShiny?: boolean
  conservationStatus?: ConservationStatus // IUCN status, or 'fantasy'/'INV'/'NA'
  isNative?: boolean // true for CA natives
  isEndemic?: boolean // true for species endemic to CA / Bay Area
  // Months when this creature appears (0=Jan..11=Dec). If both set, only spawns when current month is within window. Wraparound supported (e.g. 10..2 = Nov-Feb).
  migrationWindow?: { startMonth: number; endMonth: number }
}

export interface Move {
  name: string
  power: number
  type: 'attack' | 'defend' | 'special'
  description: string
}

export interface CapturedCreature extends Creature {
  level: number
  xp: number
  nickname?: string
  capturedAt: string
  capturedBiome: BiomeType
  parentIds?: [string, string] // for bred creatures
  isAlpha?: boolean
  isShiny?: boolean
  heldItem?: string // held item id from heldItems.ts
  happiness?: number // 0-100, boosts crit chance in battle
  learnedAbility?: string // overrides species ability; see abilities.ts TEACHABLE_ABILITIES
}

export interface JournalEntry {
  subregion: string
  biome: BiomeType
  firstVisited: string
  creaturesEncountered: string[] // creature IDs seen in this subregion
  creaturesCaptured: string[] // creature IDs captured in this subregion
  visitCount: number
}

export interface PlayerState {
  x: number
  y: number
  level: number
  xp: number
  maxXp: number
  hp: number
  maxHp: number
  coins: number
  inventory: InventoryItem[]
  team: CapturedCreature[]
  catalog: string[] // creature IDs that have been seen
  captured: string[] // creature IDs that have been captured
  journal: Record<string, JournalEntry> // keyed by subregion name
  nursery: BreedingSlot | null
  reserves: CapturedCreature[] // overflow storage when team is full
  invasivesRemoved?: number // cumulative count of invasive species removed from the ecosystem
}

export interface BreedingSlot {
  parent1: CapturedCreature
  parent2: CapturedCreature
  startedAt: string
  readyAt: string // ISO timestamp when egg hatches
  offspringId?: string // pre-determined creature ID
}

export interface InventoryItem {
  id: string
  name: string
  type: 'capture' | 'heal' | 'boost' | 'material' | 'held'
  quantity: number
  description: string
  sprite: string
}

export interface MapTile {
  x: number
  y: number
  biome: BiomeType
  subregion: string
  elevation: number
  hasCreature: boolean
  isWalkable: boolean
  bridge?: string // bridge name if this tile is a bridge
  boatDock?: boolean // true if this tile has a boat dock
  borderState?: string // e.g. "Oregon", "Nevada" — tile is beyond California
}

export interface BattleState {
  active: boolean
  wildCreature: Creature | null
  playerCreature: CapturedCreature | null
  turn: 'player' | 'enemy'
  log: string[]
  captureChance: number
}

export type QuestStatus = 'available' | 'active' | 'completed' | 'rewarded'

export interface Quest {
  id: string
  title: string
  description: string
  rangerId: string
  objective: QuestObjective
  reward: QuestReward
}

export type QuestObjective =
  | { type: 'catch'; creatureId: string; count: number }
  | { type: 'catch_any'; count: number }
  | { type: 'visit'; subregion: string }
  | { type: 'catch_type'; creatureType: CreatureType; count: number }
  | { type: 'catch_rarity'; rarity: CreatureRarity; count: number }
  | { type: 'catch_conservation'; status: ConservationStatus; count: number }
  | { type: 'remove_invasive'; count: number }

export interface QuestReward {
  xp: number
  items?: { id: string; name: string; type: InventoryItem['type']; quantity: number; description: string; sprite: string }[]
}

export interface TradeOffer {
  id: string
  give: { itemId: string; itemName: string; quantity: number }
  receive: { itemId: string; itemName: string; type: InventoryItem['type']; quantity: number; description: string; sprite: string }
}

export interface RangerTeamMember {
  creatureId: string
  level: number
  nickname?: string
}

export interface Ranger {
  id: string
  name: string
  title: string
  greeting: string
  sprite: string
  x: number
  y: number
  subregion: string
  quests: Quest[]
  trades: TradeOffer[]
  battleTeam?: RangerTeamMember[]
  battleQuote?: string
  defeatQuote?: string
  battleReward?: { xp: number }
}

export interface QuestProgress {
  questId: string
  status: QuestStatus
  progress: number // e.g. 2 out of 3 caught
}

export interface GameState {
  screen: 'title' | 'starter' | 'world' | 'encounter' | 'battle' | 'catalog' | 'inventory' | 'journal' | 'ranger' | 'trade' | 'baydex' | 'breeding' | 'achievements' | 'questlog' | 'crafting' | 'fishing' | 'ranger_battle' | 'habitat_map' | 'trainer_encounter' | 'adoption' | 'leaderboard' | 'alcatraz_escape' | 'fusion' | 'diving' | 'bart' | 'boardwalk' | 'surfing' | 'shop' | 'daily_challenges' | 'arena' | 'arena_battle' | 'move_tutor'
  player: PlayerState
  battle: BattleState
  currentBiome: BiomeType
  currentSubregion: string
  encounterCooldown: number
  activeRangerId: string | null
  questProgress: Record<string, QuestProgress>
  timeOfDay: TimeOfDay
  weather: WeatherType
  gameMinutes: number // in-game clock (0-1440)
  gameDay?: number // in-game day counter (0..359 across a 360-day year, 90 days per season)
  arenaWins: Record<string, number>
  tutorialFlags?: string[]
  bossDefeats?: BossDefeat[]
  weatherAlmanac?: Record<WeatherType, number>
  visitedLandmarks?: string[]
}

export interface BossDefeat {
  bossId: string
  bossName: string
  bossSprite: string
  bossType: 'lunar' | 'shadow'
  gameDay: number
  captured: boolean
}
