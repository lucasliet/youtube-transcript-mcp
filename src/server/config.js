const DEFAULTS = {
  mode: 'stdio',
  port: 3000,
  host: '0.0.0.0',
  cors: false,
  heartbeatIntervalMs: 25000,
  requestTimeoutMs: 60000,
  maxClients: 10,
  allowedOrigins: undefined,
  allowedHosts: undefined,
  enableDnsRebindingProtection: false
}

function toNumber(value) {
  if (value === undefined || value === null || value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

export function createServerConfig(overrides = {}) {
  const config = { ...DEFAULTS, ...normalizeOverrides(overrides) }
  validateConfig(config)
  return config
}

export function parseCliConfig(flags) {
  const overrides = {}
  if (flags.mode) overrides.mode = String(flags.mode)
  const port = toNumber(flags.port)
  if (port !== undefined) overrides.port = port
  if (flags.host) overrides.host = String(flags.host)
  if (flags.cors !== undefined) {
    const v = flags.cors
    if (v === true || v === 'true' || v === '*') {
      overrides.cors = true
    } else if (v === false || v === 'false') {
      overrides.cors = false
    } else {
      overrides.cors = String(v)
    }
  }
  const heartbeat = toNumber(flags.heartbeat ?? flags['heartbeat-interval'])
  if (heartbeat !== undefined) overrides.heartbeatIntervalMs = heartbeat
  const timeout = toNumber(flags['request-timeout'] ?? flags.timeout)
  if (timeout !== undefined) overrides.requestTimeoutMs = timeout
  const maxClients = toNumber(flags['max-clients'] ?? flags.maxClients)
  if (maxClients !== undefined) overrides.maxClients = maxClients
  return createServerConfig(overrides)
}

function normalizeOverrides(overrides) {
  const out = { ...overrides }
  if (out.cors === true || out.cors === 'true' || out.cors === '*') {
    out.cors = '*'
  } else if (out.cors === false || out.cors === 'false') {
    out.cors = false
  } else if (out.cors !== undefined && out.cors !== null) {
    out.cors = String(out.cors)
  }

  if (out.allowedOrigins !== undefined && out.allowedOrigins !== null) {
    if (Array.isArray(out.allowedOrigins)) {
      out.allowedOrigins = out.allowedOrigins.map((origin) => String(origin).trim()).filter(Boolean)
    } else if (typeof out.allowedOrigins === 'string') {
      out.allowedOrigins = out.allowedOrigins.split(',').map((origin) => origin.trim()).filter(Boolean)
    }
    if (Array.isArray(out.allowedOrigins) && out.allowedOrigins.length === 0) {
      out.allowedOrigins = undefined
    }
  }

  if (out.allowedHosts !== undefined && out.allowedHosts !== null) {
    if (Array.isArray(out.allowedHosts)) {
      out.allowedHosts = out.allowedHosts.map((host) => String(host).trim()).filter(Boolean)
    } else if (typeof out.allowedHosts === 'string') {
      out.allowedHosts = out.allowedHosts.split(',').map((host) => host.trim()).filter(Boolean)
    }
    if (Array.isArray(out.allowedHosts) && out.allowedHosts.length === 0) {
      out.allowedHosts = undefined
    }
  }

  if (out.enableDnsRebindingProtection !== undefined) {
    if (out.enableDnsRebindingProtection === true || out.enableDnsRebindingProtection === 'true') {
      out.enableDnsRebindingProtection = true
    } else if (out.enableDnsRebindingProtection === false || out.enableDnsRebindingProtection === 'false') {
      out.enableDnsRebindingProtection = false
    }
  }
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
  if (config.allowedOrigins !== undefined && config.allowedOrigins !== null) {
    if (!Array.isArray(config.allowedOrigins)) {
      throw new Error('invalid allowedOrigins')
    }
    if (config.allowedOrigins.length === 0) {
      throw new Error('invalid allowedOrigins')
    }
    for (const origin of config.allowedOrigins) {
      if (typeof origin !== 'string' || origin.length === 0) {
        throw new Error('invalid allowedOrigins')
      }
    }
  }
  if (config.allowedHosts !== undefined && config.allowedHosts !== null) {
    if (!Array.isArray(config.allowedHosts)) {
      throw new Error('invalid allowedHosts')
    }
    if (config.allowedHosts.length === 0) {
      throw new Error('invalid allowedHosts')
    }
    for (const host of config.allowedHosts) {
      if (typeof host !== 'string' || host.length === 0) {
        throw new Error('invalid allowedHosts')
      }
    }
  }
  if (typeof config.enableDnsRebindingProtection !== 'boolean') {
    throw new Error('invalid enableDnsRebindingProtection')
  }
}
