import { Hono } from 'hono'
import { createErrorResponse } from '../../../lib/response.js'
import { getCurrentQuestsResponse } from '../services/quest.service.js'

export const currentQuestsRoute = new Hono()

currentQuestsRoute.get('/:EOS_ID/currentquests', async (c) => {
  const eosId = c.req.param('EOS_ID')
  const response = await getCurrentQuestsResponse(eosId)

  if (!response) {
    return c.json(
      createErrorResponse(eosId, 'CurrentQuests', 'No quests found..'),
      404
    )
  }

  return c.json(response, 200)
})