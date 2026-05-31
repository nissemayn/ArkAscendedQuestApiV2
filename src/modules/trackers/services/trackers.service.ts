import { appSettings } from '../../../config/app-settings.js'
import { formatStatName } from '../../../lib/formatter.js'
import { createResponseBase } from '../../../lib/response.js'
import { findPlayerIdentityByEosId, findPlayerStatValues } from '../../players/repositories/player-statistics.repository.js'

type TrackersResponse = ReturnType<typeof createResponseBase> & {
  Trackers: Record<string, number>
}

export async function getTrackersResponse(eosId: string): Promise<TrackersResponse | null> {
  const player = await findPlayerIdentityByEosId(eosId)

  if (!player) {
    return null
  }

  const statValues = await findPlayerStatValues(player.playerId)
  const baseStats = statValues.filter((statValue) => statValue.period === 0)

  if (baseStats.length === 0) {
    return null
  }

  const ignored = new Set<string>(appSettings().ignoredTrackers)
  const trackers = Object.fromEntries(
    baseStats
      .filter((statValue) => !ignored.has(statValue.statName))
      .map((statValue) => [formatStatName(statValue.statName), Number(statValue.value)])
  )

  return {
    ...createResponseBase(eosId, 'Trackers'),
    Trackers: trackers
  }
}