import { BiokeaLeaderboard } from '@biokea/leaderboard'

export const GAME_ID = '3d-biodiversity-collect-em-all'

export const leaderboard = new BiokeaLeaderboard({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
})
