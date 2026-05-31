import { Hono } from 'hono'
import { createErrorResponse } from '../../../lib/response.js'
import { getCompletedQuestsResponse } from '../services/completed-quests.service.js'

export const completedQuestsRoute = new Hono()

completedQuestsRoute.get('/:EOS_ID/completed', async (c) => {
  const eosId = c.req.param('EOS_ID')
  const response = await getCompletedQuestsResponse(eosId)

  if (!response) {
    return c.json([
      createErrorResponse(eosId, 'CompletedQuests', 'No quests completed.')
    ], 404)
  }

  return c.json(response, 200)
})