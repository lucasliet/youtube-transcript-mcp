/**
 * Extracts the INNERTUBE_API_KEY from a YouTube watch page HTML content.
 * @param html The HTML string of the watch page.
 * @returns The API key string or null when not found.
 */
export function extractInnertubeApiKey(html) {
  const m = html.match(/"INNERTUBE_API_KEY":\s*"([a-zA-Z0-9_-]+)"/)
  return m ? m[1] : null
}
