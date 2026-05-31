import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export type DatabaseConfig = {
  dbHost: string
  dbName: string
  dbUser: string
  dbPassword: string
  dbPort: number
}

export type AppConfig = {
  database: DatabaseConfig
  servicePort: number
  includeModname: boolean
  timezone: string
  discordlinkFeature: boolean
  playerStatistics: string[]
  trackedNameOverrides: Record<string, string>
  addSpacesToTrackedNames: boolean
  linebreaksInProgress: boolean
  ignoredTrackers: string[]
  leaderboardTrackers: string[]
  CustomStatistics?: Record<string, string> | null
}

let _config: AppConfig | null = null

export function getConfig(): AppConfig {
  if (_config) return _config

  const configPath = join(process.cwd(), 'config.json')
  const raw = readFileSync(configPath, 'utf8')
  _config = JSON.parse(raw) as AppConfig
  return _config
}
