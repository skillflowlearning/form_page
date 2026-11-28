import { supabase } from '@/lib/supabase'

export interface RankedStudent {
  id: string
  name: string
  total_score: number
  rank: number
}

/**
 * Fetch ranked students using SQL RANK() window function via RPC,
 * with client-side RANK() fallback if migration hasn't been applied yet.
 */
export async function getLeaderboard(): Promise<{
  top3: RankedStudent[]
  allRanked: RankedStudent[]
}> {
  const { data, error } = await supabase.rpc('get_leaderboard')

  if (!error && Array.isArray(data)) {
    const allRanked: RankedStudent[] = data.map((row: any) => ({
      id: row.id,
      name: row.name || 'Student',
      total_score: Number(row.total_score ?? 0),
      rank: Number(row.rank ?? 1),
    }))
    return {
      top3: allRanked.slice(0, 3),
      allRanked,
    }
  }

  // Fallback: query profiles directly and compute RANK()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, email, total_score')
    .eq('role', 'student')
    .order('total_score', { ascending: false })

  const allRanked: RankedStudent[] = []
  let prevScore: number | null = null
  let currentRank = 0

  ;(profiles || []).forEach((p: any, idx: number) => {
    const score = Number(p.total_score ?? 0)
    if (prevScore === null || score !== prevScore) {
      currentRank = idx + 1
      prevScore = score
    }
    allRanked.push({
      id: p.id,
      name: p.name?.trim() || (p.email ? p.email.split('@')[0] : 'Student'),
      total_score: score,
      rank: currentRank,
    })
  })

  return {
    top3: allRanked.slice(0, 3),
    allRanked,
  }
}

/**
 * Fetch current user's rank and total score using SQL RANK() via RPC,
 * with fallback to getLeaderboard().
 */
export async function getMyRank(userId: string): Promise<{
  rank: number | null
  total_score: number
}> {
  if (!userId) return { rank: null, total_score: 0 }

  const { data, error } = await supabase.rpc('get_my_rank', {
    target_user_id: userId,
  })

  if (!error && Array.isArray(data) && data.length > 0) {
    return {
      rank: Number(data[0].rank),
      total_score: Number(data[0].total_score ?? 0),
    }
  }

  // Fallback
  const { allRanked } = await getLeaderboard()
  const found = allRanked.find(entry => entry.id === userId)
  if (found) {
    return { rank: found.rank, total_score: found.total_score }
  }

  return { rank: null, total_score: 0 }
}
