import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchWatchHtml } from '../../src/lib/fetchWatchHtml.js'

test('fetchWatchHtml returns response when consent not required', async () => {
  let calls = 0
  const fetchStub = async () => {
    calls += 1
    return 'ok'
  }

  const html = await fetchWatchHtml('abc123', fetchStub)
  assert.equal(html, 'ok')
  assert.equal(calls, 1)
})

test('fetchWatchHtml throws when consent token missing', async () => {
  let calls = 0
  const fetchStub = async () => {
    calls += 1
    return 'action="https://consent.youtube.com/s"'
  }

  await assert.rejects(() => fetchWatchHtml('def456', fetchStub), (err) => err.message === 'consent_cookie_create_failed')
  assert.equal(calls, 1)
})

test('fetchWatchHtml throws when consent persists after cookie injection', async () => {
  let call = 0
  const calls = []
  const fetchStub = async (url, headers) => {
    call += 1
    calls.push({ url, headers })
    if (call === 1) return 'action="https://consent.youtube.com/s" name="v" value="COOKIE"'
    return 'action="https://consent.youtube.com/s" name="v" value="OTHER"'
  }

  await assert.rejects(() => fetchWatchHtml('ghi789', fetchStub), (err) => err.message === 'consent_cookie_invalid')
  assert.equal(calls.length, 2)
  assert.equal(calls[1].headers.Cookie, 'CONSENT=YES+COOKIE')
})

test('fetchWatchHtml retries consent flow successfully when cookie accepted', async () => {
  let call = 0
  const calls = []
  const fetchStub = async (url, headers) => {
    call += 1
    calls.push({ url, headers })
    if (call === 1) return 'action="https://consent.youtube.com/s" name="v" value="TOKEN"'
    return '<html>ok</html>'
  }

  const html = await fetchWatchHtml('xyz999', fetchStub)
  assert.equal(html, '<html>ok</html>')
  assert.equal(calls.length, 2)
  assert.equal(calls[1].headers.Cookie, 'CONSENT=YES+TOKEN')
})
