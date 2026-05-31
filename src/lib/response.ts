import { getConfig } from '../config/config.js'

type ResponseBase = {
  EOS_ID: string
  InfoType: string
  ModName?: string
}

export function createResponseBase(eosId: string, infoType: string): ResponseBase {
  const base: ResponseBase = {
    EOS_ID: eosId,
    InfoType: infoType
  }

  if (getConfig().includeModname) {
    base.ModName = 'LethalQuestsUI'
  }

  return base
}

export function createErrorResponse(eosId: string, infoType: string, error: string) {
  return {
    ...createResponseBase(eosId, infoType),
    error
  }
}