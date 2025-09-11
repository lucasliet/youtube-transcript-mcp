/**
 * Chooses the most suitable caption track based on preferences and defaults.
 * @param tracks The available caption tracks from player response.
 * @param preferredLanguages Optional preferred languages.
 * @param defaultCaptionTrackIndex Optional default caption track index.
 * @param defaultTranslationSourceTrackIndices Optional default translation source indices.
 * @returns An object with url and lang, or null when none found.
 */
export function chooseTrack(
  tracks,
  preferredLanguages,
  defaultCaptionTrackIndex,
  defaultTranslationSourceTrackIndices
) {
  const manual = tracks.filter((t) => t.kind !== 'asr' && t.baseUrl)
  const asr = tracks.filter((t) => t.kind === 'asr' && t.baseUrl)
  const prefs = (preferredLanguages || []).map((x) => x.toLowerCase())
  const scan = (list) => {
    for (const lang of prefs) {
      const t = list.find((x) => x.languageCode === lang || String(x.languageCode || '').toLowerCase().startsWith(lang))
      if (t) return t
    }
    return undefined
  }
  const direct = scan(manual) || scan(asr)
  if (direct) return { url: String(direct.baseUrl).replace('&fmt=srv3', ''), lang: direct.languageCode }
  if (typeof defaultCaptionTrackIndex === 'number' && tracks[defaultCaptionTrackIndex]?.baseUrl) {
    const t = tracks[defaultCaptionTrackIndex]
    return { url: String(t.baseUrl).replace('&fmt=srv3', ''), lang: t.languageCode }
  }
  if (Array.isArray(defaultTranslationSourceTrackIndices)) {
    for (const idx of defaultTranslationSourceTrackIndices) {
      if (tracks[idx]?.baseUrl) {
        const t = tracks[idx]
        return { url: String(t.baseUrl).replace('&fmt=srv3', ''), lang: t.languageCode }
      }
    }
  }
  if (manual[0]) return { url: String(manual[0].baseUrl).replace('&fmt=srv3', ''), lang: manual[0].languageCode }
  if (asr[0]) return { url: String(asr[0].baseUrl).replace('&fmt=srv3', ''), lang: asr[0].languageCode }
  return null
}
