import { Hono } from 'hono'
import { createErrorResponse } from '../../../lib/response.js'
import { getQuestResponse } from '../services/quest.service.js'

export const questRoute = new Hono()

questRoute.get('/:EOS_ID/quest/:questId', async (c) => {
  const eosId = c.req.param('EOS_ID')
  const questId = Number(c.req.param('questId'))

  if (!Number.isInteger(questId) || questId < 0) {
    return c.json(
      createErrorResponse(eosId, 'Quest', 'Quest not found for user..'),
      404
    )
  }

  const response = await getQuestResponse(eosId, questId)

  if (!response) {
    return c.json(
      createErrorResponse(eosId, 'Quest', 'Quest not found for user..'),
      404
    )
  }

  return c.json(response, 200)
})