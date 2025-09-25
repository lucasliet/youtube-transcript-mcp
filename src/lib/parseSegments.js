/**
 * @typedef {object} TranscriptSegment
 * @property {string} text The caption text content.
 * @property {number} startInMs Segment start time in milliseconds.
 * @property {number} duration Segment duration in milliseconds.
 */

/**
 * Parses YouTube caption XML into normalized segments.
 * Supports <transcript><text> and <timedtext><body><p> formats.
 * @param {string} xml The caption XML content.
 * @returns {TranscriptSegment[]} The list of normalized segments.
 */
export function parseSegments(xml) {
  const t1 = parseTranscriptTexts(xml)
  if (t1.length) return t1
  return parseTimedtext(xml)
}

/**
 * Parses the <transcript><text> format.
 * @param {string} xml The XML content.
 * @returns {TranscriptSegment[]} Segments list.
 */
export function parseTranscriptTexts(xml) {
  const segments = []
  const textMatches = xml.matchAll(/<text[^>]*start="([^"]+)"[^>]*dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g)
  for (const match of textMatches) {
    const text = decodeHtml(String(match[3] || '')).trim()
    if (text) {
      const startMs = Math.round(Number(match[1] || 0) * 1000)
      const durationMs = Math.round(Number(match[2] || 0) * 1000)
      segments.push({ text, startInMs: startMs, duration: durationMs })
    }
  }
  return segments
}

/**
 * Parses the <timedtext><body><p> format.
 * @param {string} xml The XML content.
 * @returns {TranscriptSegment[]} Segments list.
 */
export function parseTimedtext(xml) {
  const segments = []
  const paragraphMatches = xml.matchAll(/<p[^>]*\bt="(\d+)"[^>]*\bd="(\d+)"[^>]*>([\s\S]*?)<\/p>/g)
  for (const match of paragraphMatches) {
    const start = Number(match[1] || 0)
    const duration = Number(match[2] || 0)
    const inner = String(match[3] || '')
    const text = decodeHtml(inner.replace(/<[^>]+>/g, '')).trim()
    if (text) {
      segments.push({ text, startInMs: start, duration })
    }
  }
  return segments
}

/**
 * Decodes a subset of HTML entities found in captions.
 * @param {string} s Input string.
 * @returns {string} Decoded string.
 */
export function decodeHtml(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
