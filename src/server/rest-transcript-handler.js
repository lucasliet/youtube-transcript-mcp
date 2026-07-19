import { extractVideoId } from '../lib/extractVideoId.js'
import { transcriptYt } from '../tool/transcriptYt.js'

/**
 * Parses a CSV-style preferredLanguages query value into an array of codes.
 * @param {string|undefined} raw Value of the preferredLanguages query parameter.
 * @returns {string[]} Parsed language codes (empty when raw is missing/blank).
 */
function parsePreferredLanguages(raw) {
  if (!raw || typeof raw !== 'string') return []
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

/**
 * Resolves query parameters from a request URL string.
 * @param {string} urlString Request URL (pathname + search) accepted by the handler.
 * @returns {URLSearchParams} Parsed search params; empty when URL cannot be parsed.
 */
function readSearchParams(urlString) {
  if (!urlString || typeof urlString !== 'string') return new URLSearchParams()
  const queryIndex = urlString.indexOf('?')
  if (queryIndex === -1) return new URLSearchParams()
  return new URLSearchParams(urlString.slice(queryIndex + 1))
}

/**
 * Handles a REST GET /transcript request and returns an HTTP-ready response descriptor.
 *
 * Status mapping:
 *   400 invalid_request       — missing videoUrl or unparseable YouTube id
 *   200                       — success with segments
 *   502 transcript_unavailable — transcript impl returned null
 *
 * @param {string} urlString Request URL string (pathname + query).
 * @param {{ transcriptImpl?: (args: { videoUrl: string, preferredLanguages: string[] }) => Promise<any> }} [deps]
 * @returns {Promise<{ status: number, body: any }>}
 */
export async function handleTranscriptRequest(urlString, { transcriptImpl = transcriptYt } = {}) {
  const params = readSearchParams(urlString)
  const videoUrl = params.get('videoUrl') || ''

  if (!videoUrl) {
    return {
      status: 400,
      body: { error: { code: 'invalid_request', message: 'videoUrl is required' } }
    }
  }

  const id = extractVideoId(videoUrl)
  if (!id) {
    return {
      status: 400,
      body: { error: { code: 'invalid_request', message: 'videoUrl is not a valid YouTube URL' } }
    }
  }

  const preferredLanguages = parsePreferredLanguages(params.get('preferredLanguages'))

  const segments = await transcriptImpl({ videoUrl, preferredLanguages })
  if (!segments) {
    return {
      status: 502,
      body: { error: { code: 'transcript_unavailable', message: 'Unable to retrieve transcript' } }
    }
  }

  return {
    status: 200,
    body: { videoUrl, preferredLanguages, segments }
  }
}
