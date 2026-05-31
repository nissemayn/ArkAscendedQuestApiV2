import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { contentRoute } from '../modules/content/routes/content.route.js'
import { discordLinkRoute } from '../modules/discord-link/routes/discord-link.route.js'
import { leaderboardsRoute } from '../modules/leaderboards/routes/leaderboards.route.js'
import { playerStatisticsRoute } from '../modules/players/routes/player-statistics.route.js'
import { completedQuestsRoute } from '../modules/quests/routes/completed-quests.route.js'
import { currentQuestsRoute } from '../modules/quests/routes/current-quests.route.js'
import { questRoute } from '../modules/quests/routes/quest.route.js'
import { trackersRoute } from '../modules/trackers/routes/trackers.route.js'

export const appRouter = new Hono()

appRouter.get('/', (c) => {
  return c.text('Quest API is running!')
})

appRouter.route('/', discordLinkRoute)
appRouter.route('/', playerStatisticsRoute)
appRouter.route('/', trackersRoute)
appRouter.route('/', leaderboardsRoute)
appRouter.route('/', completedQuestsRoute)
appRouter.route('/', currentQuestsRoute)
appRouter.route('/', questRoute)
appRouter.route('/', contentRoute)

appRouter.notFound((c) => {
  return c.text(`${c.req.path} does not exist`, 404)
})

appRouter.onError((error, c) => {
  if (error instanceof HTTPException) {
    return error.getResponse()
  }

  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error && error.stack ? error.stack : ''
  const exceptionText = `Exception: ${message}\nStack Trace: ${stack}\n`

  return c.text(exceptionText, 500)
})