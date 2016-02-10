// Based off: https://github.com/rackt/redux/blob/master/examples/real-world/index.js

import 'babel-polyfill'
import React from 'react'
import { render } from 'react-dom'
import Root from './containers/root'
import configureStore from './store/configureStore'
import { api } from './actions'
import Socket from './utils/socket'

if (process.env.NODE_ENV === 'production' && window.location.protocol !== "https:") window.location.href = `https:${window.location.href.substring(window.location.protocol.length)}`
if (process.env.NODE_ENV !== 'production') document.write('<script src="http://' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js"></' + 'script>')

const token = localStorage.getItem("token")

function initializeApplication(user) {
  let store
  if (user) {
    store = configureStore({
      auth: { isAuthenticated: true, user: user },
    })
  } else {
    store = configureStore()
  }

  const socket = new Socket(window.location.host || 'localhost', store)

  render(
    <Root store={store} />,
    document.getElementById('app')
  )
}

api('/profile', { authentication: token }).then(initializeApplication).catch(err => initializeApplication())
