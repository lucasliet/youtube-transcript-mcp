/**
 * Performs a GET request and returns the body as text.
 * @param url The target URL.
 * @param headers Optional request headers.
 * @returns Resolves with the response text or throws on HTTP error.
 */
export async function fetchText(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(String(res.status))
  return res.text()
}

