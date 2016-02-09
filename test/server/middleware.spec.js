import mongoose from 'mongoose'
import assert from 'assert'
import mocks from 'node-mocks-http'
import { EventEmitter } from 'events'

import config from '../../server/config'
import { ModelInvalid, ApiClientFailure } from '../../server/errors'
import { Venue, User } from '../../server/models'
import { authenticate } from '../../server/middleware'
import Factory from './support/factories'

describe('api middleware', () => {
  afterEach(done => Venue.remove({}).then(() => User.remove({}).then(done.bind(this, null))).catch(done))

  it('returns a 401 if there is no x-night-session header', done => {
    let req = mocks.createRequest()
    let res = mocks.createResponse({ eventEmitter: EventEmitter })
    res.on('end', () => {
      assert.equal(res.statusCode, 401)
      done()
    })

    authenticate()(req, res, () => {
      throw new Error('unreachable')
    })
  })

  it('returns a 401 if the x-night-session header does not match a user session token', done => {
    let req = mocks.createRequest({
      headers: {
        'x-night-session': '1234'
      }
    })
    let res = mocks.createResponse({ eventEmitter: EventEmitter })

    res.on('end', () => {
      assert.equal(res.statusCode, 401)
      done()
    })

    authenticate()(req, res, () => {
      throw new Error('unreachable')
    })
  })

  it('calls next if the x-night-session header matches a user session token', done => {
    Factory.create('user', (err, user) => {
      if (err) return done(err)
      let req = mocks.createRequest({
        headers: {
          'x-night-session': user.sessionToken
        }
      })
      let res = mocks.createResponse({ eventEmitter: EventEmitter })

      res.on('end', () => {
        done(new Error('unreachable'))
      })

      authenticate()(req, res, () => {
        done()
      })
    })
  })

  it('wraps database exceptions in a 500 error', done => {
    Factory.create('user', (err, user) => {
      if (err) return done(err)
      let req = mocks.createRequest({
        headers: {
          'x-night-session': user.sessionToken
        }
      })
      let res = mocks.createResponse({ eventEmitter: EventEmitter })

      res.on('end', () => {
        assert(res.statusCode, 500)
        done()
      })

      authenticate()(req, res, () => {
        throw new Error('simulated exception')
      })
    })
  })

  it('calls next if the x-night-session header matches a user session token which is confirmed', done => {
    Factory.create('user', {confirmed: true}, (err, user) => {
      if (err) return done(err)
      let req = mocks.createRequest({
        headers: {
          'x-night-session': user.sessionToken
        }
      })
      let res = mocks.createResponse({ eventEmitter: EventEmitter })

      res.on('end', () => {
        done(new Error('unreachable'))
      })

      authenticate(true)(req, res, () => {
        done()
      })
    })
  })

  it('returns a 401 if x-night-session header matches a user session token which is confirmed', done => {
    Factory.create('user', {confirmed: true}, (err, user) => {
      if (err) return done(err)
      let req = mocks.createRequest({
        headers: {
          'x-night-session': user.sessionToken
        }
      })
      let res = mocks.createResponse({ eventEmitter: EventEmitter })

      res.on('end', () => {
        assert.equal(res.statusCode, 401)
        done()
      })

      authenticate(false)(req, res, () => {
        done(new Error('unreachable'))
      })
    })
  })

  it('calls next if the x-night-session header matches a user session token which is unconfirmed', done => {
    Factory.create('user', {confirmed: false}, (err, user) => {
      if (err) return done(err)
      let req = mocks.createRequest({
        headers: {
          'x-night-session': user.sessionToken
        }
      })
      let res = mocks.createResponse({ eventEmitter: EventEmitter })

      res.on('end', () => {
        done(new Error('unreachable'))
      })

      authenticate(false)(req, res, () => {
        done()
      })
    })
  })

  it('returns a 401 if x-night-session header matches a user session token which is unconfirmed', done => {
    Factory.create('user', {confirmed: false}, (err, user) => {
      if (err) return done(err)
      let req = mocks.createRequest({
        headers: {
          'x-night-session': user.sessionToken
        }
      })
      let res = mocks.createResponse({ eventEmitter: EventEmitter })

      res.on('end', () => {
        assert.equal(res.statusCode, 401)
        done()
      })

      authenticate(true)(req, res, () => {
        done(new Error('unreachable'))
      })
    })
  })
})
