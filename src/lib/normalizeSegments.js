 

/**
 * Normalizes, deduplicates and sorts segments by start time.
 * @param items The raw segments list.
 * @returns Cleaned segment list.
 */
export function normalizeSegments(items) {
  const seen = new Set()
  const cleaned = items
    .filter((s) => s && typeof s.text === 'string')
    .map((s) => ({ text: s.text.trim(), startInMs: s.startInMs, duration: s.duration }))
    .filter((s) => s.text.length > 0)
  const dedup = cleaned.filter((s) => {
    const k = `${s.startInMs}|${s.text}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  return dedup.sort((a, b) => a.startInMs - b.startInMs)
}
