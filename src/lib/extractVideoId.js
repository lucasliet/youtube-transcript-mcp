/**
 * Extracts a YouTube video ID from a full URL or short link.
 * @param url The YouTube video URL.
 * @returns The 11-character video ID or null when not found.
 */
/**
 * Extracts an 11-character YouTube video identifier from a URL string.
 * @param url The input YouTube URL or short link.
 * @returns The detected video identifier or null when extraction fails.
 */
export function extractVideoId(url) {
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|live\/)|youtu\.be\/)([\w-]{11})/)
  return match ? match[1] : null
}
