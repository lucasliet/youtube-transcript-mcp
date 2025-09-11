import { fetchText } from './fetchText.js'

/**
 * Retrieves the YouTube watch page HTML, handling consent when necessary.
 * @param videoId The YouTube video ID.
 * @returns The HTML string of the watch page.
 */
export async function fetchWatchHtml(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`
  let html = await fetchText(url, { 'Accept-Language': 'en-US' })
  if (html.includes('action="https://consent.youtube.com/s"')) {
    const v = html.match(/name="v" value="(.*?)"/)
    if (!v) throw new Error('consent_cookie_create_failed')
    html = await fetchText(url, { 'Accept-Language': 'en-US', Cookie: `CONSENT=YES+${v[1]}` })
    if (html.includes('action="https://consent.youtube.com/s"')) throw new Error('consent_cookie_invalid')
  }
  return html
}
