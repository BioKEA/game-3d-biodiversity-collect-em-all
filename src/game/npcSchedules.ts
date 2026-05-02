import type { TimeOfDay } from '@/types/game'

export type RangerActivity = 'patrol' | 'rest' | 'campfire' | 'observe' | 'fishing' | 'research'

export interface ScheduleBlock {
  activity: RangerActivity
  dx: number // position offset from base x
  dy: number // position offset from base y
  canBattle: boolean
  greeting?: string // override greeting for this time block
}

export type RangerSchedule = Record<TimeOfDay, ScheduleBlock>

const DEFAULT_SCHEDULE: RangerSchedule = {
  dawn: { activity: 'observe', dx: 0, dy: 0, canBattle: true },
  day: { activity: 'patrol', dx: 0, dy: 0, canBattle: true },
  dusk: { activity: 'campfire', dx: 0, dy: 1, canBattle: true },
  night: { activity: 'rest', dx: 0, dy: 0, canBattle: false,
    greeting: 'Zzz... *yawn* Oh, it\'s you. I\'m off-duty. Come back when the sun\'s up if you want to battle.' },
}

const SCHEDULES: Record<string, RangerSchedule> = {
  'ranger-presidio': {
    dawn: { activity: 'observe', dx: 1, dy: -1, canBattle: true,
      greeting: 'Early riser! Dawn is perfect for spotting coyotes returning from their nightly rounds.' },
    day: { activity: 'patrol', dx: 0, dy: 0, canBattle: true },
    dusk: { activity: 'campfire', dx: -1, dy: 1, canBattle: true,
      greeting: 'Pull up a log! I\'m reviewing today\'s field notes by firelight.' },
    night: { activity: 'rest', dx: 0, dy: 0, canBattle: false,
      greeting: '*yawns* The Presidio creatures are settled in for the night, and so am I. Come back at dawn?' },
  },
  'ranger-muir': {
    dawn: { activity: 'research', dx: 0, dy: -1, canBattle: true,
      greeting: 'Shh — I\'m counting banana slug eggs. Dawn is when they\'re most visible.' },
    day: { activity: 'patrol', dx: 0, dy: 0, canBattle: true },
    dusk: { activity: 'observe', dx: 1, dy: 0, canBattle: true,
      greeting: 'The old-growth forest gets magical at dusk. Listen to the owls waking up.' },
    night: { activity: 'campfire', dx: -1, dy: 1, canBattle: true,
      greeting: 'Can\'t sleep when the forest is this alive. Sit by the fire — I\'ll tell you about the night creatures.' },
  },
  'ranger-diablo': {
    dawn: { activity: 'observe', dx: 0, dy: -1, canBattle: true,
      greeting: 'Sunrise from Mt. Diablo is unbeatable. You can see the Sierra from here on a clear morning.' },
    day: { activity: 'patrol', dx: 1, dy: 0, canBattle: true },
    dusk: { activity: 'campfire', dx: 0, dy: 1, canBattle: true,
      greeting: 'The sunset paints the whole valley gold from up here. Join me by the fire.' },
    night: { activity: 'rest', dx: 0, dy: 0, canBattle: false,
      greeting: 'Too dark to hike safely up here. I\'m camping until dawn — you should find shelter too.' },
  },
  'ranger-tilden': {
    dawn: { activity: 'patrol', dx: -1, dy: 0, canBattle: true,
      greeting: 'Morning patrol through the eucalyptus grove. The newts are crossing the trail!' },
    day: { activity: 'patrol', dx: 0, dy: 0, canBattle: true },
    dusk: { activity: 'observe', dx: 0, dy: -1, canBattle: true,
      greeting: 'Watching the deer come down to the creek for their evening drink. Peaceful hour.' },
    night: { activity: 'rest', dx: 0, dy: 1, canBattle: false,
      greeting: 'The park\'s closed after dark, technically. But I won\'t tell if you don\'t. I\'m resting though — no battles.' },
  },
  'ranger-don-edwards': {
    dawn: { activity: 'observe', dx: 0, dy: 0, canBattle: true,
      greeting: 'The shorebirds are most active at dawn. I\'ve counted twelve species already this morning.' },
    day: { activity: 'research', dx: 1, dy: 0, canBattle: true },
    dusk: { activity: 'observe', dx: -1, dy: 0, canBattle: true,
      greeting: 'Low tide at dusk — the mudflats are teeming. Best time for salt marsh harvesting.' },
    night: { activity: 'campfire', dx: 0, dy: 1, canBattle: false,
      greeting: 'Night herons are hunting. I\'m just logging data by lantern light. No battles tonight.' },
  },
  'ranger-golden-gate': {
    dawn: { activity: 'patrol', dx: 0, dy: 0, canBattle: true,
      greeting: 'Buenos días! The bridge is quiet at dawn. Best time to spot peregrine falcons diving from the towers.' },
    day: { activity: 'patrol', dx: 0, dy: 0, canBattle: true },
    dusk: { activity: 'observe', dx: 0, dy: -1, canBattle: true,
      greeting: 'The fog\'s rolling in under the bridge — a sea of white swallowing the bay. Never gets old.' },
    night: { activity: 'patrol', dx: 1, dy: 0, canBattle: true,
      greeting: 'Night watch on the bridge. Even after dark, there\'s always something stirring out here.' },
  },
  'ranger-ocean-beach': {
    dawn: { activity: 'observe', dx: 0, dy: -1, canBattle: true,
      greeting: 'The sanderlings are chasing the waves. There\'s something meditative about dawn on this beach.' },
    day: { activity: 'patrol', dx: 0, dy: 0, canBattle: true },
    dusk: { activity: 'fishing', dx: 1, dy: 0, canBattle: true,
      greeting: 'Casting a line before dark. The stripers run close to shore at dusk. Want to try?' },
    night: { activity: 'rest', dx: 0, dy: 0, canBattle: false,
      greeting: 'The rip currents make this beach dangerous at night. I\'m calling it a day. Come back tomorrow!' },
  },
  'ranger-tamalpais': {
    dawn: { activity: 'observe', dx: 0, dy: -2, canBattle: true,
      greeting: 'Hiked to the summit for sunrise. From up here you can see the fog filling every valley like a lake.' },
    day: { activity: 'patrol', dx: 0, dy: 0, canBattle: true },
    dusk: { activity: 'campfire', dx: 1, dy: 1, canBattle: true,
      greeting: 'The mountain quiets down at dusk. Just me, the fire, and the sound of wind in the manzanita.' },
    night: { activity: 'rest', dx: 0, dy: 0, canBattle: false,
      greeting: 'Tam is no place to wander in the dark. I\'m in my bivouac — see you when the light returns.' },
  },
  'ranger-downtown': {
    dawn: { activity: 'patrol', dx: 0, dy: 0, canBattle: true,
      greeting: 'The city\'s still waking up. Best time to spot the urban raptors before the crowds.' },
    day: { activity: 'patrol', dx: 0, dy: 0, canBattle: true },
    dusk: { activity: 'observe', dx: -1, dy: 0, canBattle: true,
      greeting: 'Watching the peregrine pair roost on the high-rises. Urban wildlife is my specialty.' },
    night: { activity: 'patrol', dx: 0, dy: 1, canBattle: true,
      greeting: 'Night shift downtown. You\'d be surprised what comes out — raccoons own this city after dark.' },
  },
  'ranger-coyote-hills': {
    dawn: { activity: 'research', dx: 0, dy: 0, canBattle: true,
      greeting: 'Documenting the Ohlone shell mound at first light. This land has thousands of years of history.' },
    day: { activity: 'patrol', dx: 1, dy: 0, canBattle: true },
    dusk: { activity: 'observe', dx: -1, dy: 0, canBattle: true,
      greeting: 'The burrowing owls are peeking out of their dens for the evening hunt. Stay quiet!' },
    night: { activity: 'rest', dx: 0, dy: 0, canBattle: false,
      greeting: 'The hills are beautiful at night but I can barely keep my eyes open. Tomorrow, yeah?' },
  },
  'ranger-alcatraz': {
    dawn: { activity: 'patrol', dx: 0, dy: 0, canBattle: true,
      greeting: 'Dawn on the Rock. The cormorants are stretching their wings. Even ghosts sleep at sunrise.' },
    day: { activity: 'patrol', dx: 0, dy: 0, canBattle: true },
    dusk: { activity: 'observe', dx: 0, dy: 0, canBattle: true,
      greeting: 'The last ferry left. It\'s just us and the night herons now. The island changes after dark...' },
    night: { activity: 'patrol', dx: 0, dy: 0, canBattle: true,
      greeting: 'You hear that? Footsteps in the cellblock. Don\'t worry — it\'s probably just the wind. ...Probably.' },
  },
  'ranger-coit': {
    dawn: { activity: 'observe', dx: 0, dy: -1, canBattle: true,
      greeting: 'The wild parrots are waking up! Their squawks echo off Telegraph Hill every dawn.' },
    day: { activity: 'patrol', dx: 0, dy: 0, canBattle: true },
    dusk: { activity: 'campfire', dx: 1, dy: 0, canBattle: true },
    night: { activity: 'rest', dx: 0, dy: 0, canBattle: false,
      greeting: 'The parrots are roosting and so am I. The hill gets slippery at night — be careful out there.' },
  },
  'ranger-oracle': {
    dawn: { activity: 'patrol', dx: 0, dy: 0, canBattle: true },
    day: { activity: 'patrol', dx: 0, dy: 0, canBattle: true },
    dusk: { activity: 'observe', dx: -1, dy: 0, canBattle: true,
      greeting: 'Stadium lights are off tonight. The waterfront comes alive at dusk — harbor seals, pelicans, the works.' },
    night: { activity: 'rest', dx: 0, dy: 1, canBattle: false,
      greeting: 'The concourse is empty. I\'m wrapping up my rounds — nothing but raccoons raiding the trash cans.' },
  },
  'ranger-twinpeaks': {
    dawn: { activity: 'observe', dx: 0, dy: -1, canBattle: true,
      greeting: 'The fog is boiling over Twin Peaks like a waterfall. If you squint you can see both bridges from here.' },
    day: { activity: 'research', dx: 0, dy: 0, canBattle: true },
    dusk: { activity: 'observe', dx: 0, dy: 0, canBattle: true,
      greeting: 'Best 360° sunset view in the city. The Mission Blue butterfly habitat is right below us.' },
    night: { activity: 'campfire', dx: 1, dy: 1, canBattle: true,
      greeting: 'City lights below, stars above. I\'m tracking the Mission Blue moth population by UV trap tonight.' },
  },
}

export function getRangerSchedule(rangerId: string): RangerSchedule {
  return SCHEDULES[rangerId] ?? DEFAULT_SCHEDULE
}

export function getRangerActivity(rangerId: string, timeOfDay: TimeOfDay): ScheduleBlock {
  const schedule = getRangerSchedule(rangerId)
  return schedule[timeOfDay]
}

export function getRangerPosition(rangerId: string, baseX: number, baseY: number, timeOfDay: TimeOfDay): { x: number; y: number } {
  const block = getRangerActivity(rangerId, timeOfDay)
  return { x: baseX + block.dx, y: baseY + block.dy }
}

export function canRangerBattle(rangerId: string, timeOfDay: TimeOfDay): boolean {
  return getRangerActivity(rangerId, timeOfDay).canBattle
}

export function getActivityEmoji(activity: RangerActivity): string {
  switch (activity) {
    case 'patrol': return '🚶'
    case 'rest': return '💤'
    case 'campfire': return '🔥'
    case 'observe': return '🔭'
    case 'fishing': return '🎣'
    case 'research': return '📋'
  }
}

export function getActivityLabel(activity: RangerActivity): string {
  switch (activity) {
    case 'patrol': return 'Patrolling'
    case 'rest': return 'Resting'
    case 'campfire': return 'At campfire'
    case 'observe': return 'Observing wildlife'
    case 'fishing': return 'Fishing'
    case 'research': return 'Doing research'
  }
}
