import { Hono } from 'hono'
import { createErrorResponse } from '../../../lib/response.js'
import { getPlayerStatisticsResponse } from '../services/player-statistics.service.js'

export const playerStatisticsRoute = new Hono()

playerStatisticsRoute.get('/:EOS_ID/statistics', async (c) => {
  const eosId = c.req.param('EOS_ID')
  const response = await getPlayerStatisticsResponse(eosId)

  if (!response) {
    return c.json(createErrorResponse(eosId, 'PlayerStatistics', 'Player not found'), 404)
  }

  return c.json(response, 200)
})