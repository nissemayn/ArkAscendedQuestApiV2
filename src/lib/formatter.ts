import { getConfig } from '../config/config.js'

function twoDigits(value: number): string {
  return String(value).padStart(2, '0')
}

export function sanitizeDescription(description: string): string {
  return description.replace(/\{[^}]+\}\//g, '')
}

export function formatStatName(statName: string): string {
  const config = getConfig()
  const override = config.trackedNameOverrides[statName]

  if (override) {
    return override
  }

  if (config.addSpacesToTrackedNames) {
    return statName.replace(/(?<!\b|[A-Z])(?=[A-Z])/g, ' ')
  }

  return statName
}

export function formatTimestamp(unixTimestamp: bigint | number): string {
  const timestamp = Number(unixTimestamp)

  if (timestamp === 0) {
    return 'Timestamp missing!'
  }

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: getConfig().timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  const parts = formatter.formatToParts(new Date(timestamp * 1000))
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${twoDigits(Number(values.day))}-${twoDigits(Number(values.month))}-${values.year} ${values.hour}:${values.minute}`
}