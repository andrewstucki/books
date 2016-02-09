import request from 'supertest'
import mongoose from 'mongoose'
import _ from 'underscore'
import assert from 'assert'

import config from '../../server/config'
import Factory from './support/factories'
import { User, Venue } from '../../server/models'
import queue from '../../server/queue'

require('./support/setup')

describe('api routes', () => {
  let server

  beforeEach(() => {
    queue.testMode.clear()
    server = require('../../server/index')
  })

  afterEach(() => server.close())

  describe('venues endpoints', () => {
    afterEach(done => Venue.remove({}).then(() => User.remove({}).then(done.bind(this, null))).catch(done))

    it('returns a 200 for listing all venues for an area')
  })

  describe('authorized venues endpoints', () => {
    let admin

    beforeEach(done => {
      Factory.create('user', (err, user) => {
        if (err) return done(err)
        admin = user
        done()
      })
    })
    afterEach(done => Venue.remove({}).then(() => User.remove({}).then(done.bind(this, null))).catch(done))

    it('returns a 201 for attending a venue')
    it('returns a 202 for removing a venue from attendance')
  })

  describe('lacking authentication on authenticated endpoints', () => {
    it('get profile responds with a 401', (done) => {
      request(server)
        .get('/api/v1/profile')
        .expect('Content-Type', /json/)
        .expect(401, done);
    })

    it('post venues/:id responds with a 401', (done) => {
      request(server)
        .post('/api/v1/venues/1')
        .expect('Content-Type', /json/)
        .expect(401, done);
    })

    it('delete venues/:id responds with a 401', (done) => {
      request(server)
        .delete('/api/v1/venues/1')
        .expect('Content-Type', /json/)
        .expect(401, done);
    })

    it('delete session responds with a 401', (done) => {
      request(server)
        .delete('/api/v1/session')
        .expect('Content-Type', /json/)
        .expect(401, done);
    })

    it('post confirm/resend responds with a 401', (done) => {
      request(server)
        .post('/api/v1/confirm/resend')
        .expect('Content-Type', /json/)
        .expect(401, done);
    })
  })
})
