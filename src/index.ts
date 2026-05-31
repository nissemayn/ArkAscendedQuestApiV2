import { serve } from '@hono/node-server'
import { getConfig } from './config/config.js'
import { prisma, verifyDatabaseConnection } from './lib/prisma.js'
import { appRouter } from './routes/index.js'

process.title = 'Ark Ascended Quest API'
if (process.stdout.isTTY) {
  process.stdout.write('\u001b]0;Ark Ascended Quest API\u0007')
}

const port = getConfig().servicePort

async function pauseIfInteractive(): Promise<void> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return
  }

  await new Promise<void>((resolve) => {
    process.stdout.write('Press Enter to exit...')
    process.stdin.resume()
    process.stdin.once('data', () => {
      resolve()
    })
  })
}

async function bootstrap(): Promise<void> {
  try {
    await verifyDatabaseConnection()
    await prisma.$connect()
    await prisma.$queryRawUnsafe('SELECT 1')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Database connection check failed: ${message}`)
    try {
      await prisma.$disconnect()
    } catch {
      // Ignore disconnect errors during failed bootstrap.
    }
    await pauseIfInteractive()
    process.exit(1)
  }

  serve({
    fetch: appRouter.fetch,
    port
  }, () => {
    console.log(`API running on http://localhost:${port}`)
  })
}

void bootstrap()