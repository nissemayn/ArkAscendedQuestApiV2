import { sanitizeDescription, formatTimestamp } from '../../../lib/formatter.js'
import { createResponseBase } from '../../../lib/response.js'
import { findCompletedQuestsByEosId } from '../repositories/completed-quests.repository.js'

type CompletedQuestItem = {
  'Quest ID': number
  Name: string
  Description: string
  TimeStamp: string
}

type CompletedQuestsResponse = ReturnType<typeof createResponseBase> & {
  CompletedQuests: CompletedQuestItem[]
}

export async function getCompletedQuestsResponse(eosId: string): Promise<CompletedQuestsResponse | null> {
  const completedQuests = await findCompletedQuestsByEosId(eosId)

  if (completedQuests.length === 0) {
    return null
  }

  return {
    ...createResponseBase(eosId, 'CompletedQuests'),
    CompletedQuests: completedQuests.map((quest) => ({
      'Quest ID': Number(quest.questId),
      Name: quest.name,
      Description: sanitizeDescription(quest.description),
      TimeStamp: formatTimestamp(quest.completedTimeStamp)
    }))
  }
}