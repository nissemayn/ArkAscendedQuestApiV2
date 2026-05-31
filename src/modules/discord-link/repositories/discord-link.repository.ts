import { prisma } from '../../../lib/prisma.js'

export type DiscordLinkRecord = {
  eosId: string
  discordId: string | null
  activationCode: number | null
  timestamp: number
}

export async function findByEosIdOrActivationCode(eosId: string, activationCode: number): Promise<DiscordLinkRecord[]> {
  const records = await prisma.discordlink.findMany({
    where: {
      OR: [
        { eos_id: eosId },
        { activationcode: activationCode }
      ]
    }
  })

  return records.map((record) => ({
    eosId: record.eos_id,
    discordId: record.discord_id,
    activationCode: record.activationcode,
    timestamp: record.timestamp
  }))
}

export async function deleteByEosId(eosId: string): Promise<void> {
  await prisma.discordlink.deleteMany({
    where: {
      eos_id: eosId
    }
  })
}

export async function createPendingLink(eosId: string, activationCode: number): Promise<void> {
  await prisma.discordlink.create({
    data: {
      eos_id: eosId,
      activationcode: activationCode,
      timestamp: Math.floor(Date.now() / 1000)
    }
  })
}
