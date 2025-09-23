import { extractVideoId } from '../lib/extractVideoId.js'
import { fetchWatchHtml } from '../lib/fetchWatchHtml.js'
import { extractInnertubeApiKey } from '../lib/extractInnertubeApiKey.js'
import { fetchInnertubePlayer } from '../lib/fetchInnertubePlayer.js'
import { assertPlayability } from '../lib/assertPlayability.js'
import { chooseTrack } from '../lib/chooseTrack.js'
import { parseSegments } from '../lib/parseSegments.js'
import { normalizeSegments } from '../lib/normalizeSegments.js'
import { logError } from '../lib/log.js'

/**
 * @typedef {object} TranscriptYtArgs
 * @property {string} videoUrl Full YouTube video URL.
 * @property {string[]} [preferredLanguages] Optional ordered language codes preference, e.g., ['pt-BR','en'].
 */

/**
 * @typedef {object} TranscriptSegment
 * @property {string} text The caption text content.
 * @property {number} startInMs Segment start time in milliseconds.
 * @property {number} duration Segment duration in milliseconds.
 */

/**
 * Retrieves YouTube transcript segments from a video URL.
 * Returns null on any failure; logs categorized errors.
 * @param {TranscriptYtArgs} args The request payload with videoUrl and optional preferredLanguages.
 * @returns {Promise<TranscriptSegment[] | null>} A list of transcript segments or null when unavailable.
 */
/**
 * Fetches YouTube transcript segments from a video URL for LLM consumption.
 * @param {TranscriptYtArgs} args The arguments object.
 * @returns {Promise<TranscriptSegment[]|null>} Array of transcript segments or null if failed.
 */

export async function transcriptYt(args) {
  try {
    const id = extractVideoId(args.videoUrl)
    if (!id) {
      logError('invalid_url', 'unable_to_extract_video_id')
      return null
    }
    const html = await fetchWatchHtml(id)
    const apiKey = extractInnertubeApiKey(html)
    if (!apiKey) {
      logError('inaccessible', 'innertube_api_key_not_found')
      return null
    }
    const data = await fetchInnertubePlayer(apiKey, id)
    assertPlayability(data?.playabilityStatus)
    const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || []
    const audioTracks = data?.captions?.playerCaptionsTracklistRenderer?.audioTracks || []
    const defaultCaptionTrackIndex = typeof audioTracks?.[0]?.defaultCaptionTrackIndex === 'number' ? audioTracks[0].defaultCaptionTrackIndex : undefined
    const defaultTranslationSourceTrackIndices = data?.captions?.playerCaptionsTracklistRenderer?.defaultTranslationSourceTrackIndices
    if (!Array.isArray(tracks) || tracks.length === 0) {
      logError('no_captions', 'no_caption_tracks_found')
      return null
    }
    const picked = chooseTrack(tracks, args.preferredLanguages, defaultCaptionTrackIndex, defaultTranslationSourceTrackIndices)
    if (!picked) {
      logError('no_captions', 'no_suitable_track_found')
      return null
    }
    const xml = await fetch(picked.url, { headers: { 'Accept-Language': 'en-US' } }).then((r) => {
      if (!r.ok) throw new Error(`yt_request_failed_${r.status}`)
      return r.text()
    })
    const segments = normalizeSegments(parseSegments(xml))
    if (!segments.length) {
      logError('no_captions', 'no_segments_after_parsing')
      return null
    }
    return segments
  } catch (err) {
    const msg = typeof err?.message === 'string' ? err.message : ''
    if (msg.includes('yt_request_failed_') || msg === 'ip_blocked') logError('network_error', msg)
    else if (msg === 'video_unavailable' || msg === 'video_unplayable' || msg === 'age_restricted' || msg === 'request_blocked') logError('inaccessible', msg)
    else logError('other_error', msg || 'unexpected_error')
    return null
  }
}

export const tool = ['transcript_yt', {
  schema: {
    type: 'function',
    function: {
      name: 'transcript_yt',
      description: 'Fetches YouTube transcript segments from a video URL for LLM consumption.',
  parameters: transcriptSchema,
      strict: true
    }
  },
  /** @type {(args: TranscriptYtArgs) => Promise<ReturnType<typeof transcriptYt>>} */
  fn: async (args) => transcriptYt(args)
}]

export const __testables = {
  extractVideoId,
  extractInnertubeApiKey,
  chooseTrack,
  parseSegments
}
import { transcriptSchema } from '../lib/transcriptSchema.js'
