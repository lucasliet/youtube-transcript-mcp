const DEFAULTS = {
  mode: 'stdio',
  port: 3000,
  host: '0.0.0.0',
  cors: false,
  heartbeatIntervalMs: 25000,
  requestTimeoutMs: 60000,
  maxClients: 10
}

export function createServerConfig(overrides = {}) {
  const config = { ...DEFAULTS, ...normalizeOverrides(overrides) }
  validateConfig(config)
  return config
}

export function parseCliConfig(flags) {
  const overrides = {}
  if (flags.mode) overrides.mode = String(flags.mode)
  if (flags.port !== undefined) overrides.port = Number(flags.port)
  if (flags.host) overrides.host = String(flags.host)
  if (flags.cors) overrides.cors = flags.cors === 'true' ? '*' : String(flags.cors)
  if (flags.heartbeat) overrides.heartbeatIntervalMs = Number(flags.heartbeat)
  if (flags['heartbeat-interval']) overrides.heartbeatIntervalMs = Number(flags['heartbeat-interval'])
  if (flags['request-timeout']) overrides.requestTimeoutMs = Number(flags['request-timeout'])
  if (flags.timeout) overrides.requestTimeoutMs = Number(flags.timeout)
  if (flags['max-clients']) overrides.maxClients = Number(flags['max-clients'])
  if (flags.maxClients) overrides.maxClients = Number(flags.maxClients)
  return createServerConfig(overrides)
}

function normalizeOverrides(overrides) {
  const out = { ...overrides }
  if (out.cors === true) out.cors = '*'
  if (out.cors === false || out.cors === 'false') out.cors = false
  return out
}

function validateConfig(config) {
  if (!['stdio', 'remote'].includes(config.mode)) {
    throw new Error('invalid mode')
  }
  if (!Number.isInteger(config.port) || config.port < 0 || config.port > 65535) {
    throw new Error('invalid port')
  }
  if (typeof config.host !== 'string' || config.host.length === 0) {
    throw new Error('invalid host')
  }
  if (!Number.isInteger(config.heartbeatIntervalMs) || config.heartbeatIntervalMs <= 0) {
    throw new Error('invalid heartbeat interval')
  }
  if (!Number.isInteger(config.requestTimeoutMs) || config.requestTimeoutMs <= 0) {
    throw new Error('invalid request timeout')
  }
  if (config.requestTimeoutMs <= config.heartbeatIntervalMs) {
    throw new Error('request timeout must be greater than heartbeat interval')
  }
  if (!Number.isInteger(config.maxClients) || config.maxClients <= 0) {
    throw new Error('invalid maxClients')
  }
}
