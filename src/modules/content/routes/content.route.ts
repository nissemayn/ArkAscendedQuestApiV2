import { Hono } from 'hono'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const contentRoute = new Hono()

contentRoute.get('/content/:file', async (c) => {
  const fileName = path.basename(c.req.param('file'))
  const contentPath = path.join(process.cwd(), 'content', fileName)

  const contents = await readFile(contentPath, 'utf8')

  return c.text(contents)
})
