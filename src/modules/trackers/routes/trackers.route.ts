import { Hono } from 'hono'
import { createErrorResponse } from '../../../lib/response.js'
import { getTrackersResponse } from '../services/trackers.service.js'

export const trackersRoute = new Hono()

trackersRoute.get('/:EOS_ID/trackers', async (c) => {
  const eosId = c.req.param('EOS_ID')
  const response = await getTrackersResponse(eosId)

  if (!response) {
    return c.json([
      createErrorResponse(eosId, 'Trackers', 'Player not found.')
    ], 404)
  }

  return c.json(response, 200)
})