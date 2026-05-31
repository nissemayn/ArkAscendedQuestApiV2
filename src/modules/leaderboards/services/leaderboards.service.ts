import { appSettings } from '../../../config/app-settings.js'
import { formatStatName } from '../../../lib/formatter.js'
import { createResponseBase } from '../../../lib/response.js'
import { prisma } from '../../../lib/prisma.js'
import { findPlayerIdentityByEosId } from '../../players/repositories/player-statistics.repository.js'

type LeaderboardEntry = {
  Name?: string
  TribeName?: string
  Value: number
  Position: number
  You?: true
}

type LeaderboardPage = Array<Record<string, LeaderboardEntry[]>>

type LeaderboardsResponse = ReturnType<typeof createResponseBase> & {
  PlayerLeaderboard: Record<number, LeaderboardPage>
  TribeLeaderboard: Record<number, LeaderboardPage>
}

type PlayerStatRow = {
  LQPlayerID: bigint
  StatName: string
  Value: string
}

function paginateLeaderboardGroups(groups: Array<Record<string, LeaderboardEntry[]>>): Record<number, LeaderboardPage> {
  const pages: Record<number, LeaderboardPage> = {}
  let page = 1

  for (const group of groups) {
    const currentPage = pages[page] ?? []
    currentPage.push(group)
    pages[page] = currentPage

    if (currentPage.length === 5) {
      page += 1
    }
  }

  return pages
}

export async function getLeaderboardsResponse(eosId: string): Promise<LeaderboardsResponse | null> {
  const currentPlayer = await findPlayerIdentityByEosId(eosId)

  if (!currentPlayer) {
    return null
  }

  const statRows = await prisma.lethalquestsascended_stat_values.findMany({
    where: {
      Period: 0,
      StatName: {
        in: [...appSettings().leaderboardTrackers]
      }
    }
  })

  const playerIds = [...new Set(statRows.map((row) => row.LQPlayerID.toString()))].map((id) => BigInt(id))
  const players = await prisma.lethalquestsascended_players.findMany({
    where: {
      LQPlayerID: {
        in: playerIds
      }
    }
  })

  const playerById = new Map(players.map((player) => [player.LQPlayerID.toString(), player]))
  const rowsByTracker = new Map<string, PlayerStatRow[]>()

  for (const row of statRows) {
    const existing = rowsByTracker.get(row.StatName) ?? []
    existing.push({
      LQPlayerID: row.LQPlayerID,
      StatName: row.StatName,
      Value: row.Value.toString()
    })
    rowsByTracker.set(row.StatName, existing)
  }

  const playerGroups = appSettings().leaderboardTrackers.map((trackerName) => {
    const rows = [...(rowsByTracker.get(trackerName) ?? [])]

    rows.sort((left, right) => Number(right.Value) - Number(left.Value))

    const entries: LeaderboardEntry[] = rows.slice(0, 10).flatMap((row, index) => {
      const player = playerById.get(row.LQPlayerID.toString())

      if (!player) {
        return []
      }

      return [{
        Name: `${player.Name ?? ''} (${player.TribeName ?? ''})`,
        Value: Number(row.Value),
        Position: index + 1,
        ...(player.eos_id === eosId ? { You: true as const } : {})
      }]
    })

    return {
      [formatStatName(trackerName)]: entries
    }
  })

  const tribeGroups = appSettings().leaderboardTrackers.map((trackerName) => {
    const rows = rowsByTracker.get(trackerName) ?? []
    const totalsByTribe = new Map<string, number>()

    for (const row of rows) {
      const player = playerById.get(row.LQPlayerID.toString())
      const tribeName = player?.TribeName ?? ''

      if (!tribeName) {
        continue
      }

      totalsByTribe.set(tribeName, (totalsByTribe.get(tribeName) ?? 0) + Number(row.Value))
    }

    const entries = [...totalsByTribe.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 10)
      .map(([tribeName, value], index) => ({
        TribeName: tribeName,
        Value: value,
        Position: index + 1,
        ...(tribeName === (currentPlayer.tribeName ?? '') ? { You: true as const } : {})
      }))

    return {
      [formatStatName(trackerName)]: entries
    }
  })

  return {
    ...createResponseBase(eosId, 'Leaderboards'),
    PlayerLeaderboard: paginateLeaderboardGroups(playerGroups),
    TribeLeaderboard: paginateLeaderboardGroups(tribeGroups)
  }
}