import { constants, books, requests, users } from '../actions'

export default class Socket {
  constructor(url, store) {
    const socketProtocol = window.location.protocol === "https:" ? 'wss' : 'ws'
    const self = this

    this.websocket = new WebSocket(`${socketProtocol}://${url}`, 'books')
    this.store = store
    this.connected = false
    this.authenticated = false

    this.store.subscribe(this.storeUpdate.bind(this))
    this.websocket.onmessage = event => self.handleMessage(JSON.parse(event.data))
    this.websocket.onopen = () => self.connected = true
    this.websocket.onclose = () => {
      self.connected = false
      self.authenticated = false
    }
  }

  handleMessage(data) {
    const { type, entity, payload } = data
    switch(type) {
    case 'update':
      if (entity === 'books') return this.store.dispatch(books.update(payload))
      if (entity === 'users') return this.store.dispatch(users.update(payload))
      if (entity === 'submittedRequests' || entity === 'pendingRequests') return this.store.dispatch(requests.update(entity, payload))
      break
    case 'remove':
      if (entity === 'books') return this.store.dispatch(books.remove(payload))
      if (entity === 'submittedRequests' || entity === 'pendingRequests') return this.store.dispatch(requests.remove(entity, payload))
      break
    case 'add':
      if (entity === 'books') return this.store.dispatch(books.add(payload))
      if (entity === 'submittedRequests' || entity === 'pendingRequests') return this.store.dispatch(requests.add(entity, payload))
      break
    }
  }

  storeUpdate() {
    if (this.connected) {
      const { isAuthenticated, user } = this.store.getState().auth
      if (isAuthenticated && !this.authenticated) {
        this.websocket.send(JSON.stringify({
          type: 'login',
          data: user.token
        }))
        this.authenticated = true
      } else if (!isAuthenticated && this.authenticated) {
        this.websocket.send(JSON.stringify({
          type: 'logout',
          data: user.token
        }))
        this.authenticated = false
      }
    }
  }

  close() {
    this.websocket.close()
  }
}
