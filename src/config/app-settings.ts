import { getConfig } from './config.js'

export function appSettings() {
  const config = getConfig()
  return {
    discordLinkFeature: config.discordlinkFeature,
    playerStatistics: config.playerStatistics,
    ignoredTrackers: config.ignoredTrackers,
    leaderboardTrackers: config.leaderboardTrackers,
    customStatistics: config.CustomStatistics ?? null
  }
}