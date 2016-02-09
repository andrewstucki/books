import { constants, books, requests, users } from '../actions'

export default class Socket {
  constructor(url, store) {
    const socketProtocol = window.location.protocol === "https:" ? 'wss' : 'ws'
    this.websocket = new WebSocket(`${socketProtocol}://${url}`, 'books')
    this.store = store
    const self = this
    this.websocket.onmessage = event => self.handleMessage(JSON.parse(event.data))
  }

  handleMessage(data) {
    const { type, entity, payload } = data
    switch(type) {
    case 'update':
      if (entity === 'users') return this.store.dispatch(users.update(payload))
    case 'remove':
      if (entity === 'books') return this.store.dispatch(books.remove(payload))
      if (entity === 'requests') return this.store.dispatch(requests.remove(payload))
    case 'add':
      if (entity === 'books') return this.store.dispatch(books.add(payload))
      if (entity === 'requests') return this.store.dispatch(requests.add(payload))
    }
  }

  close() {
    this.websocket.close()
  }
}
