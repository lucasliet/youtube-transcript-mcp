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
  const out = []
  const textRe = /<text[^>]*start="([^"]+)"[^>]*dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g
  let m
  while ((m = textRe.exec(xml)) !== null) {
    const text = decodeHtml(String(m[3] || '')).trim()
    if (!text) continue
    const startMs = Math.round(Number(m[1] || 0) * 1000)
    const durMs = Math.round(Number(m[2] || 0) * 1000)
    out.push({ text, startInMs: startMs, duration: durMs })
  }
  return out
}

/**
 * Parses the <timedtext><body><p> format.
 * @param {string} xml The XML content.
 * @returns {TranscriptSegment[]} Segments list.
 */
export function parseTimedtext(xml) {
  const out = []
  const pRe = /<p[^>]*\bt="(\d+)"[^>]*\bd="(\d+)"[^>]*>([\s\S]*?)<\/p>/g
  let p
  while ((p = pRe.exec(xml)) !== null) {
    const start = Number(p[1] || 0)
    const duration = Number(p[2] || 0)
    const inner = String(p[3] || '')
    const text = decodeHtml(inner.replace(/<[^>]+>/g, '')).trim()
    if (!text) continue
    out.push({ text, startInMs: start, duration })
  }
  return out
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
