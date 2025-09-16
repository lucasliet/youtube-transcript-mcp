import { ClientSession } from './clientSession.js'

export class SessionRegistry {
  constructor(config, logFn) {
    this.config = config
    this.log = logFn
    this.sessions = new Map()
  }

  count() {
    return this.sessions.size
  }

  canAccept() {
    return this.sessions.size < this.config.maxClients
  }

  create(response) {
    if (!this.canAccept()) return null
    const session = new ClientSession(response, this.config, this.log)
    this.sessions.set(session.connectionId, session)
    return session
  }

  get(connectionId) {
    return this.sessions.get(connectionId)
  }

  delete(connectionId) {
    const session = this.sessions.get(connectionId)
    if (!session) return
    session.close()
    this.sessions.delete(connectionId)
  }

  closeAll() {
    for (const id of this.sessions.keys()) {
      this.delete(id)
    }
  }
}
