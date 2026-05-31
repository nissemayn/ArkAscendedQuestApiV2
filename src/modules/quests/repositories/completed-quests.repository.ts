import { prisma } from '../../../lib/prisma.js'

type CompletedQuestRecord = {
  questId: bigint
  name: string
  description: string
  completedTimeStamp: bigint
}

export async function findCompletedQuestsByEosId(eosId: string): Promise<CompletedQuestRecord[]> {
  const player = await prisma.lethalquestsascended_players.findUnique({
    where: {
      eos_id: eosId
    }
  })

  if (!player) {
    return []
  }

  const statuses = await prisma.lethalquestsascended_quests_status.findMany({
    where: {
      LQPlayerID: player.LQPlayerID,
      QuestType: 0,
      Completed: 1
    },
    orderBy: {
      QuestID: 'asc'
    }
  })

  if (statuses.length === 0) {
    return []
  }

  const definitions = await prisma.lethalquestsascended_quest_definitions.findMany({
    where: {
      QuestType: 0,
      QuestID: {
        in: statuses.map((status) => status.QuestID)
      }
    }
  })

  const definitionsByQuestId = new Map(definitions.map((definition) => [definition.QuestID.toString(), definition]))

  return statuses.flatMap((status) => {
    const definition = definitionsByQuestId.get(status.QuestID.toString())

    if (!definition) {
      return []
    }

    return [{
      questId: status.QuestID,
      name: definition.Name,
      description: definition.Description,
      completedTimeStamp: status.CompletedTimeStamp
    }]
  })
}