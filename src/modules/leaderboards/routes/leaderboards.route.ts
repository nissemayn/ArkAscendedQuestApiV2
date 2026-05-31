import { Hono } from 'hono'
import { getLeaderboardsResponse } from '../services/leaderboards.service.js'

export const leaderboardsRoute = new Hono()

leaderboardsRoute.get('/:EOS_ID/leaderboards', async (c) => {
  const eosId = c.req.param('EOS_ID')
  const response = await getLeaderboardsResponse(eosId)

  return c.json(response, 200)
})