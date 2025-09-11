/**
 * Calls the YouTube Innertube player endpoint and returns JSON.
 * @param apiKey The Innertube API key.
 * @param videoId The YouTube video ID.
 * @returns The parsed JSON response object.
 */
export async function fetchInnertubePlayer(apiKey, videoId) {
  const url = `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept-Language': 'en-US' },
    body: JSON.stringify({ context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } }, videoId })
  })
  if (res.status === 429) throw new Error('ip_blocked')
  if (!res.ok) throw new Error(`yt_request_failed_${res.status}`)
  return res.json()
}
