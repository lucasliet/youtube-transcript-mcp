import test from 'node:test'
import assert from 'node:assert/strict'
import { registerTranscriptTool } from '../../src/server/register-transcript-tool.js'
import * as transcriptModule from '../../src/tool/transcriptYt.js'

test('registerTranscriptTool registers metadata and normalizes arguments', async () => {
  let registered
  const server = {
    registerTool(metadata, handler) {
      registered = { metadata, handler }
    }
  }

  const calls = []
  const stub = async (args) => {
    calls.push(args)
    return 'ok'
  }

  registerTranscriptTool(server, stub)

  assert.deepEqual(registered.metadata, transcriptModule.transcriptToolMetadata)

  await registered.handler({ videoUrl: 'https://youtube.com/watch?v=abc', preferredLanguages: ['pt-BR'] })
  await registered.handler({ videoUrl: 'https://youtube.com/watch?v=def', preferredLanguages: 'pt-BR' })

  assert.deepEqual(calls[0], { videoUrl: 'https://youtube.com/watch?v=abc', preferredLanguages: ['pt-BR'] })
  assert.deepEqual(calls[1], { videoUrl: 'https://youtube.com/watch?v=def', preferredLanguages: undefined })
})
