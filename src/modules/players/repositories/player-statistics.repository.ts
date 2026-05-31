import { prisma } from '../../../lib/prisma.js'

export type PlayerIdentityRecord = {
  eosId: string
  playerId: bigint
  name: string | null
  tribeName: string | null
}

export type StatValueRecord = {
  period: number
  statName: string
  value: string
}

export type QuestStatusRecord = {
  questType: number
  questId: bigint
  completed: number
  timeStamp: bigint
  completedTimeStamp: bigint
}

export type QuestDefinitionRecord = {
  questType: number
  questId: bigint
  name: string
  description: string
}

export type QuestRequirementRecord = {
  questType: number
  questId: bigint
  statName: string
  requiredValue: bigint
}

export type DiscordLinkRecord = {
  discordId: string | null
}

export async function findPlayerIdentityByEosId(eosId: string): Promise<PlayerIdentityRecord | null> {
  const player = await prisma.lethalquestsascended_players.findUnique({
    where: {
      eos_id: eosId
    }
  })

  if (!player) {
    return null
  }

  return {
    eosId: player.eos_id,
    playerId: player.LQPlayerID,
    name: player.Name,
    tribeName: player.TribeName
  }
}

export async function findPlayerStatValues(playerId: bigint): Promise<StatValueRecord[]> {
  const statValues = await prisma.lethalquestsascended_stat_values.findMany({
    where: {
      LQPlayerID: playerId
    },
    orderBy: [
      { Period: 'asc' },
      { StatName: 'asc' }
    ]
  })

  return statValues.map((value) => ({
    period: value.Period,
    statName: value.StatName,
    value: value.Value.toString()
  }))
}

export async function findLatestSpecialQuestForPlayer(playerId: bigint, questType: 1 | 2): Promise<QuestStatusRecord | null> {
  const status = await prisma.lethalquestsascended_quests_status.findFirst({
    where: {
      LQPlayerID: playerId,
      QuestType: questType
    },
    orderBy: {
      TimeStamp: 'desc'
    }
  })

  if (!status) {
    return null
  }

  return {
    questType: status.QuestType,
    questId: status.QuestID,
    completed: status.Completed,
    timeStamp: status.TimeStamp,
    completedTimeStamp: status.CompletedTimeStamp
  }
}

export async function findQuestDefinition(questType: number, questId: bigint): Promise<QuestDefinitionRecord | null> {
  const definition = await prisma.lethalquestsascended_quest_definitions.findUnique({
    where: {
      QuestType_QuestID: {
        QuestType: questType,
        QuestID: questId
      }
    }
  })

  if (!definition) {
    return null
  }

  return {
    questType: definition.QuestType,
    questId: definition.QuestID,
    name: definition.Name,
    description: definition.Description
  }
}

export async function findQuestRequirements(questType: number, questId: bigint): Promise<QuestRequirementRecord[]> {
  const requirements = await prisma.lethalquestsascended_quest_requirements.findMany({
    where: {
      QuestType: questType,
      QuestID: questId
    },
    orderBy: {
      StatName: 'asc'
    }
  })

  return requirements.map((requirement) => ({
    questType: requirement.QuestType,
    questId: requirement.QuestID,
    statName: requirement.StatName,
    requiredValue: requirement.RequiredValue
  }))
}

export async function findLastCompletedQuestForPlayer(playerId: bigint): Promise<QuestStatusRecord | null> {
  const status = await prisma.lethalquestsascended_quests_status.findFirst({
    where: {
      LQPlayerID: playerId,
      Completed: 1
    },
    orderBy: {
      CompletedTimeStamp: 'desc'
    }
  })

  if (!status) {
    return null
  }

  return {
    questType: status.QuestType,
    questId: status.QuestID,
    completed: status.Completed,
    timeStamp: status.TimeStamp,
    completedTimeStamp: status.CompletedTimeStamp
  }
}

export async function findDiscordLinkByEosId(eosId: string): Promise<DiscordLinkRecord | null> {
  const discordLink = await prisma.discordlink.findUnique({
    where: {
      eos_id: eosId
    }
  })

  if (!discordLink) {
    return null
  }

  return {
    discordId: discordLink.discord_id
  }
}