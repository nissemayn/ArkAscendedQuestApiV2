import { createResponseBase } from '../../../lib/response.js'
import {
  createPendingLink,
  deleteByEosId,
  findByEosIdOrActivationCode
} from '../repositories/discord-link.repository.js'

type DiscordLinkSuccessResponse = ReturnType<typeof createResponseBase> & {
  ActivationCode?: number
  error?: string
}

type DiscordLinkResult =
  | { status: 200; body: DiscordLinkSuccessResponse }
  | { status: 400; body: { error: string } }

function createDiscordLinkResponse(eosId: string, error?: string, activationCode?: number): DiscordLinkSuccessResponse {
  const response: DiscordLinkSuccessResponse = {
    ...createResponseBase(eosId, 'DiscordLink')
  }

  if (error) {
    response.error = error
  }

  if (activationCode !== undefined) {
    response.ActivationCode = activationCode
  }

  return response
}

export async function linkDiscord(eosId: string, activationCode: number): Promise<DiscordLinkResult> {
  const existingUsers = await findByEosIdOrActivationCode(eosId, activationCode)

  if (existingUsers.length > 0) {
    for (const user of existingUsers) {
      if (user.eosId === eosId && user.discordId !== null) {
        return {
          status: 200,
          body: createDiscordLinkResponse(eosId, 'EOS_ID already linked.')
        }
      }

      if (user.eosId === eosId && user.activationCode !== null) {
        if (Math.floor(Date.now() / 1000) - user.timestamp > 5 * 60) {
          await deleteByEosId(eosId)
        } else {
          return {
            status: 200,
            body: createDiscordLinkResponse(eosId, 'EOS_ID already waiting for activation.', user.activationCode)
          }
        }
      }
    }
  }

  try {
    await createPendingLink(eosId, activationCode)

    return {
      status: 200,
      body: createDiscordLinkResponse(eosId, undefined, activationCode)
    }
  } catch (error) {
    return {
      status: 400,
      body: {
        error: `Database error: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }
}
