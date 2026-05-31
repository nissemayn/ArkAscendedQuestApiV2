import { Hono } from 'hono'
import { linkDiscord } from '../services/discord-link.service.js'

export const discordLinkRoute = new Hono()

discordLinkRoute.post('/:EOS_ID/discordlink', async (c) => {
  const eosId = c.req.param('EOS_ID')

  let payload: unknown

  try {
    payload = await c.req.json()
  } catch {
    payload = {}
  }

  const activationCode = Number((payload as { activationcode?: unknown }).activationcode)

  if (!Number.isFinite(activationCode)) {
    return c.json({
      error: 'Activationcode not provided.'
    }, 400)
  }

  const result = await linkDiscord(eosId, activationCode)

  return c.json(result.body, result.status)
})
