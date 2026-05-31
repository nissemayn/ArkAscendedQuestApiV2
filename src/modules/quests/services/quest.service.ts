import { formatStatName, sanitizeDescription } from '../../../lib/formatter.js'
import { createResponseBase } from '../../../lib/response.js'
import { findActiveQuestByEosIdAndQuestId, findActiveQuestsByEosId, type QuestRecord } from '../repositories/quest.repository.js'

type QuestProgressItem = {
  Name: string
  Progress: string
  Percentage: number
}

type QuestResponse = ReturnType<typeof createResponseBase> & {
  Quest: {
    Name: string
    Progress: QuestProgressItem[]
  }
}

type CurrentQuestResponse = ReturnType<typeof createResponseBase> & {
  CurrentQuests: Array<{
    QuestID: number
    Name: string
    Description: string
    OverallProgress: number
    Progress: QuestProgressItem[]
  }>
}

function toNumber(value: bigint | string): number {
  return Number(value)
}

function buildQuestProgressItems(quest: QuestRecord): QuestProgressItem[] {
  const progressByStat = new Map(quest.progressValues.map((value) => [value.statName, toNumber(value.value)]))

  return quest.requirements.map((requirement) => {
    const requiredValue = toNumber(requirement.requiredValue)
    const rawProgress = progressByStat.get(requirement.statName) ?? 0
    const progress = Math.min(rawProgress, requiredValue)

    return {
      Name: formatStatName(requirement.statName),
      Progress: `${progress}/${requiredValue}`,
      Percentage: progress > 0 ? Math.floor((progress / requiredValue) * 100) : 0
    }
  })
}

export async function getQuestResponse(eosId: string, questId: number): Promise<QuestResponse | null> {
  const quest = await findActiveQuestByEosIdAndQuestId(eosId, questId)

  if (!quest) {
    return null
  }

  const progressByStat = new Map(quest.progressValues.map((value) => [value.statName, toNumber(value.value)]))

  return {
    ...createResponseBase(eosId, 'Quest'),
    Quest: {
      Name: quest.name,
      Progress: buildQuestProgressItems(quest)
    }
  }
}

export async function getCurrentQuestsResponse(eosId: string): Promise<CurrentQuestResponse | null> {
  const quests = await findActiveQuestsByEosId(eosId)

  if (quests.length === 0) {
    return null
  }

  return {
    ...createResponseBase(eosId, 'CurrentQuests'),
    CurrentQuests: quests.map((quest) => {
      const progressItems = buildQuestProgressItems(quest)
      const totals = progressItems.reduce((result, item) => {
        const [progressPart = '0', requiredPart = '0'] = item.Progress.split('/')
        const progress = Number(progressPart)
        const required = Number(requiredPart)

        return {
          progress: result.progress + progress,
          required: result.required + required
        }
      }, { progress: 0, required: 0 })

      return {
        QuestID: Number(quest.questId),
        Name: quest.name,
        Description: sanitizeDescription(quest.description),
        OverallProgress: totals.progress === 0 ? 0 : Math.floor((totals.progress / totals.required) * 100),
        Progress: progressItems
      }
    })
  }
}