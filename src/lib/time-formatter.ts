export function formatDuration(seconds: number): string {
  const parts: string[] = []
  let remaining = Math.max(0, Math.floor(seconds))

  if (remaining >= 86400) {
    const days = Math.floor(remaining / 86400)
    remaining %= 86400
    parts.push(`${days} day${days > 1 ? 's' : ''}`)
  }

  if (remaining >= 3600) {
    const hours = Math.floor(remaining / 3600)
    remaining %= 3600
    parts.push(`${hours} hour${hours > 1 ? 's' : ''}`)
  }

  if (remaining >= 60) {
    const minutes = Math.floor(remaining / 60)
    remaining %= 60
    parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`)
  }

  if (remaining > 0) {
    parts.push(`${remaining} second${remaining > 1 ? 's' : ''}`)
  } else if (parts.length === 0) {
    parts.push('0 seconds')
  }

  return parts.join(', ')
}