import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import * as mariadb from 'mariadb'
import { PrismaClient } from '../../generated/prisma/client.js'
import { getConfig } from '../config/config.js'

declare global {
  var __prisma__: PrismaClient | undefined
}

function createAdapter() {
  const db = getConfig().database

  return new PrismaMariaDb({
    host: db.dbHost,
    port: db.dbPort,
    user: db.dbUser,
    password: db.dbPassword,
    database: db.dbName
  })
}

export const prisma = globalThis.__prisma__ ?? new PrismaClient({
  adapter: createAdapter()
})

function formatMariadbError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return String(error)
  }

  const withMessage = error as {
    code?: string
    errno?: number
    sqlMessage?: string
    message?: string
  }

  const parts: string[] = []

  if (withMessage.code) {
    parts.push(`code=${withMessage.code}`)
  }

  if (typeof withMessage.errno === 'number') {
    parts.push(`errno=${withMessage.errno}`)
  }

  if (withMessage.sqlMessage) {
    parts.push(withMessage.sqlMessage)
  } else if (withMessage.message) {
    parts.push(withMessage.message)
  }

  return parts.length > 0 ? parts.join(' | ') : String(error)
}

export async function verifyDatabaseConnection(): Promise<void> {
  const db = getConfig().database
  let connection: mariadb.Connection | null = null

  try {
    connection = await mariadb.createConnection({
      host: db.dbHost,
      port: db.dbPort,
      user: db.dbUser,
      password: db.dbPassword,
      database: db.dbName,
      connectTimeout: 5000
    })

    await connection.query('SELECT 1')
  } catch (error) {
    throw new Error(formatMariadbError(error))
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma__ = prisma
}