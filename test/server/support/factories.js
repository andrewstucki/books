import Factory from 'factory-girl'
import hat from 'hat'
import mongoose from 'mongoose'

import { User, Venue } from '../../../server/models'

Factory.define('user', User, {
  email: Factory.sequence(n => `user${n}@example.com`),
  username: Factory.sequence(n => `username${n}`),
  name: Factory.sequence(n => `User ${n}`),
  password: 'password',
  confirmed: true,
  confirmationToken: () => hat(),
  sessionToken: () => hat()
})

Factory.define('venue', Venue, {
  attendees: [],
  name: Factory.sequence(n => `Venue ${n}`),
  url: Factory.sequence(n => `http://www.test${n}.com`),
  image: Factory.sequence(n => `http://www.test${n}.com/image.jpg`),
  snippet: 'I love this place!'
})

export default Factory
