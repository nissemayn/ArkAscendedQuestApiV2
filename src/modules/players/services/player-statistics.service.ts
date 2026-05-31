import { appSettings } from '../../../config/app-settings.js'
import { formatStatName, formatTimestamp, sanitizeDescription } from '../../../lib/formatter.js'
import { createResponseBase } from '../../../lib/response.js'
import { prisma } from '../../../lib/prisma.js'
import { formatDuration } from '../../../lib/time-formatter.js'
import {
  findDiscordLinkByEosId,
  findLastCompletedQuestForPlayer,
  findLatestSpecialQuestForPlayer,
  findPlayerIdentityByEosId,
  findPlayerStatValues,
  findQuestDefinition,
  findQuestRequirements
} from '../repositories/player-statistics.repository.js'

type PlayerStatisticsResponse = ReturnType<typeof createResponseBase> & {
  DiscordLinked: boolean
  PlayerStatistics: Record<string, string | number>
  DailyQuest: {
    Name: string
    Progress: string
    'Time Left': string
    Description: string
  } | null
  WeeklyQuest: {
    Name: string
    Progress: string
    'Time Left': string
    Description: string
  } | null
  LastCompletedQuest: {
    'Quest ID': number
    Name: string
    TimeStamp: string
  } | null
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)]
}

function numericValue(value: string | bigint): number {
  return Number(value)
}

function normalizeCustomStatValue(value: unknown): string | number {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (typeof value === 'bigint') {
    return Number(value)
  }

  if (value === null || value === undefined) {
    return 0
  }

  return String(value)
}

async function runCustomStatistics(eosId: string): Promise<Array<[string, string | number]>> {
  const customStatistics = appSettings().customStatistics

  if (!customStatistics) {
    return []
  }

  const safeEosId = eosId.replace(/'/g, "''")
  const entries: Array<[string, string | number]> = []

  for (const [statKey, sqlTemplate] of Object.entries(customStatistics)) {
    const sql = sqlTemplate.replaceAll('{eos_id}', safeEosId)

    try {
      const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(sql)
      const firstRow = rows[0]
      const firstValue = firstRow ? Object.values(firstRow)[0] : 0

      entries.push([statKey, normalizeCustomStatValue(firstValue)])
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      entries.push([statKey, `ERROR: Invalid expression in CustomStatistics. Error: ${message}`])
    }
  }

  return entries
}

function buildProgressString(
  statValuesByName: Map<string, number>,
  requirements: Array<{ statName: string; requiredValue: bigint }>
): string {
  if (requirements.length === 0) {
    return 'Not Initialized'
  }

  return requirements.map((requirement) => {
    const requiredValue = numericValue(requirement.requiredValue)
    const progressValue = Math.min(statValuesByName.get(requirement.statName) ?? 0, requiredValue)

    return `${formatStatName(requirement.statName)}: ${progressValue}/${requiredValue}`
  }).join('\n')
}

async function buildSpecialQuest(
  playerId: bigint,
  questType: 1 | 2,
  durationSeconds: number,
  statValuesByPeriod: Map<number, Map<string, number>>
) {
  const latestQuest = await findLatestSpecialQuestForPlayer(playerId, questType)

  if (!latestQuest) {
    return null
  }

  const definition = await findQuestDefinition(questType, latestQuest.questId)

  if (!definition) {
    return null
  }

  const timeLeft = numericValue(latestQuest.timeStamp) + durationSeconds - Math.floor(Date.now() / 1000)

  let progress = 'Completed!'

  if (latestQuest.completed !== 1) {
    const requirements = await findQuestRequirements(questType, latestQuest.questId)
    progress = buildProgressString(statValuesByPeriod.get(questType) ?? new Map(), requirements)
  }

  return {
    Name: definition.name,
    Progress: progress,
    'Time Left': formatDuration(timeLeft),
    Description: sanitizeDescription(definition.description)
  }
}

export async function getPlayerStatisticsResponse(eosId: string): Promise<PlayerStatisticsResponse | null> {
  const player = await findPlayerIdentityByEosId(eosId)

  if (!player) {
    return null
  }

  const [statValues, discordLink, lastCompletedQuest] = await Promise.all([
    findPlayerStatValues(player.playerId),
    findDiscordLinkByEosId(eosId),
    findLastCompletedQuestForPlayer(player.playerId)
  ])

  const statValuesByPeriod = new Map<number, Map<string, number>>()

  for (const statValue of statValues) {
    const statsForPeriod = statValuesByPeriod.get(statValue.period) ?? new Map<string, number>()
    statsForPeriod.set(statValue.statName, numericValue(statValue.value))
    statValuesByPeriod.set(statValue.period, statsForPeriod)
  }

  const baseStats = statValuesByPeriod.get(0)

  if (!baseStats) {
    return null
  }

  const playerStatisticsEntries: Array<[string, string | number]> = [
    ['Name', player.name ?? ''],
    ['TribeName', player.tribeName ?? '']
  ]

  for (const statName of unique(appSettings().playerStatistics)) {
    if (statName === 'Name' || statName === 'TribeName') {
      continue
    }

    playerStatisticsEntries.push([statName, baseStats.get(statName) ?? 0])
  }

  const customStatisticsEntries = await runCustomStatistics(eosId)
  playerStatisticsEntries.push(...customStatisticsEntries)

  const formattedPlayerStatistics = Object.fromEntries(
    playerStatisticsEntries.map(([key, value]) => [formatStatName(key), value])
  )

  const [dailyQuest, weeklyQuest, lastCompletedDefinition] = await Promise.all([
    buildSpecialQuest(player.playerId, 1, 86400, statValuesByPeriod),
    buildSpecialQuest(player.playerId, 2, 604800, statValuesByPeriod),
    lastCompletedQuest ? findQuestDefinition(lastCompletedQuest.questType, lastCompletedQuest.questId) : Promise.resolve(null)
  ])

  return {
    ...createResponseBase(eosId, 'PlayerStats'),
    DiscordLinked: appSettings().discordLinkFeature ? Boolean(discordLink?.discordId) : true,
    PlayerStatistics: formattedPlayerStatistics,
    DailyQuest: dailyQuest,
    WeeklyQuest: weeklyQuest,
    LastCompletedQuest: lastCompletedQuest && lastCompletedDefinition
      ? {
        'Quest ID': numericValue(lastCompletedQuest.questId),
        Name: lastCompletedDefinition.name,
        TimeStamp: formatTimestamp(lastCompletedQuest.completedTimeStamp)
      }
      : null
  }
}