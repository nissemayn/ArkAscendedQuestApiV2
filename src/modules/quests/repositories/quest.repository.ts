import { prisma } from '../../../lib/prisma.js'

type QuestRequirementRecord = {
  statName: string
  requiredValue: bigint
}

type QuestProgressValueRecord = {
  statName: string
  value: string
}

export type QuestRecord = {
  questId: bigint
  name: string
  description: string
  requirements: QuestRequirementRecord[]
  progressValues: QuestProgressValueRecord[]
}

async function findPlayerByEosId(eosId: string) {
  return prisma.lethalquestsascended_players.findUnique({
    where: {
      eos_id: eosId
    }
  })
}

async function buildQuestRecords(playerId: bigint, questIds: bigint[]): Promise<QuestRecord[]> {
  if (questIds.length === 0) {
    return []
  }

  const [definitions, requirements, progressValues] = await Promise.all([
    prisma.lethalquestsascended_quest_definitions.findMany({
      where: {
        QuestType: 0,
        QuestID: {
          in: questIds
        }
      }
    }),
    prisma.lethalquestsascended_quest_requirements.findMany({
      where: {
        QuestType: 0,
        QuestID: {
          in: questIds
        }
      },
      orderBy: [
        { QuestID: 'asc' },
        { StatName: 'asc' }
      ]
    }),
    prisma.lethalquestsascended_stat_values.findMany({
      where: {
        LQPlayerID: playerId,
        Period: 0
      }
    })
  ])

  const definitionsByQuestId = new Map(definitions.map((definition) => [definition.QuestID.toString(), definition]))
  const requirementsByQuestId = new Map<string, QuestRequirementRecord[]>()

  for (const requirement of requirements) {
    const key = requirement.QuestID.toString()
    const existing = requirementsByQuestId.get(key) ?? []
    existing.push({
      statName: requirement.StatName,
      requiredValue: requirement.RequiredValue
    })
    requirementsByQuestId.set(key, existing)
  }

  const progressByStatName = new Map(
    progressValues.map((value) => [value.StatName, value.Value.toString()])
  )

  return questIds.flatMap((questId) => {
    const definition = definitionsByQuestId.get(questId.toString())

    if (!definition) {
      return []
    }

    const requirementsForQuest = requirementsByQuestId.get(questId.toString()) ?? []

    return [{
      questId,
      name: definition.Name,
      description: definition.Description,
      requirements: requirementsForQuest,
      progressValues: requirementsForQuest.map((requirement) => ({
        statName: requirement.statName,
        value: progressByStatName.get(requirement.statName) ?? '0'
      }))
    }]
  })
}

export async function findActiveQuestByEosIdAndQuestId(eosId: string, questId: number): Promise<QuestRecord | null> {
  const player = await findPlayerByEosId(eosId)

  if (!player) {
    return null
  }

  const status = await prisma.lethalquestsascended_quests_status.findFirst({
    where: {
      LQPlayerID: player.LQPlayerID,
      QuestType: 0,
      Completed: 0,
      QuestID: BigInt(questId)
    }
  })

  if (!status) {
    return null
  }

  const [quest] = await buildQuestRecords(player.LQPlayerID, [status.QuestID])

  return quest ?? null
}

export async function findActiveQuestsByEosId(eosId: string): Promise<QuestRecord[]> {
  const player = await findPlayerByEosId(eosId)

  if (!player) {
    return []
  }

  const statuses = await prisma.lethalquestsascended_quests_status.findMany({
    where: {
      LQPlayerID: player.LQPlayerID,
      QuestType: 0,
      Completed: 0
    },
    orderBy: {
      QuestID: 'asc'
    }
  })

  return buildQuestRecords(player.LQPlayerID, statuses.map((status) => status.QuestID))
}