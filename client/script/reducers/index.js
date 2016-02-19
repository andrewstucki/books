import { omit } from 'lodash/object'
import { routerStateReducer as router } from 'redux-router'
import { combineReducers } from 'redux'

import { constants, flash } from '../actions'

function clearCache(state, entities) {
  const newState = {}
  entities.forEach(entity => {
    newState[entity] = {}
    newState[`${entity}Loaded`] = false
  })
  return Object.assign({}, omit(state, entities.concat(entities.map(entity => `${entity}Loaded`))), newState)
}

function handleCache(state, entity, value, setLoaded = true) {
  let flagLoaded = false
  let newEntities = {}
  if (Array.isArray(value)) {
    flagLoaded = true
    value.forEach(newEntity => {
      newEntities[newEntity.id] = newEntity
    })
  } else {
    newEntities[value.id] = value
  }
  const mergedEntities = Object.assign({}, state[entity], newEntities)
  let newState = {}
  if (setLoaded && flagLoaded) newState[`${entity}Loaded`] = true
  newState[entity] = mergedEntities
  return Object.assign({}, state, newState)
}

function removeCache(state, entity, value) {
  let newState = {}
  newState[entity] = omit(state[entity], value)
  return Object.assign({}, state, newState)
}

// Updates authentication state
function auth(state = { isAuthenticated: false, user: {} }, action) {
  const { type, value } = action
  switch (type) {
  case constants.LOGIN_SUCCESS:
    localStorage.setItem("token", value.token)
    return {
      isAuthenticated: true,
      user: value
    }
  case constants.LOGOUT_SUCCESS:
  case constants.LOGIN_FAILURE:
    localStorage.removeItem("token")
    return {
      isAuthenticated: false,
      user: {}
    }
  default:
    return state
  }
}

function cache(state = { users: {}, books: {}, pendingRequests: {}, submittedRequests: {}, booksLoaded: false, pendingRequestsLoaded: false, submittedRequestsLoaded: false }, action) {
  const { type, entity, value } = action
  switch(type) {
  case constants.BOOKS_SUCCESS:
  case constants.PENDING_REQUESTS_SUCCESS:
  case constants.SUBMITTED_REQUESTS_SUCCESS:
  case constants.BOOK_ADD:
  case constants.BOOK_UPDATE:
  case constants.USER_UPDATE:
  case constants.USER_SUCCESS:
  case constants.REQUEST_ADD:
    return handleCache(state, entity, value)
  case constants.USER_BOOKS_SUCCESS:
    return handleCache(state, entity, value, false)
  case constants.REQUESTS_REMOVE:
  case constants.BOOKS_REMOVE:
    return removeCache(state, entity, value)
  case constants.LOGOUT_SUCCESS:
    return clearCache(state, ['pendingRequests', 'submittedRequests'])
  default:
    return state
  }
}

function message(state = null, action) {
  const { type, value, error } = action
  switch(type) {
    case constants.RESET_MESSAGE:
    case "@@reduxReactRouter/routerDidChange":
      return null
    case constants.SET_MESSAGE:
      return value
    case constants.SIGNUP_SUCCESS:
    case constants.RESEND_SUCCESS:
      return {
        type: flash.SUCCESS,
        message: value.message
      }
    default:
      if (error) return {
        type: flash.ERROR,
        message: error
      }
  }
  return state
}

function bookOptions(state = [], action) {
  const { type, entity, value } = action
  switch(type) {
    case "@@reduxReactRouter/routerDidChange":
    case constants.LOGOUT_SUCCESS:
    case constants.CREATE_BOOK_REQUEST:
      return []
    case constants.BOOK_SEARCH_SUCCESS:
      return value
  }
  return state
}

export default combineReducers({
  cache,
  auth,
  message,
  bookOptions,
  router
})

// //User
// export const USER_BOOKS_REQUEST = 'USER_BOOKS_REQUEST'
// export const USER_BOOKS_SUCCESS = 'USER_BOOKS_SUCCESS'
// export const USER_BOOKS_FAILURE = 'USER_BOOKS_FAILURE'
//
// //Books
// export const BOOKS_REQUEST = 'BOOKS_REQUEST'
// export const BOOKS_SUCCESS = 'BOOKS_SUCCESS'
// export const BOOKS_FAILURE = 'BOOKS_FAILURE'
// export const CREATE_BOOK_REQUEST = 'CREATE_BOOK_REQUEST'
// export const CREATE_BOOK_SUCCESS = 'CREATE_BOOK_SUCCESS'
// export const CREATE_BOOK_FAILURE = 'CREATE_BOOK_FAILURE'
// export const BOOK_SEARCH_REQUEST = 'BOOK_SEARCH_REQUEST'
// export const BOOK_SEARCH_SUCCESS = 'BOOK_SEARCH_SUCCESS'
// export const BOOK_SEARCH_FAILURE = 'BOOK_SEARCH_FAILURE'
// export const PENDING_REQUESTS_REQUEST = 'PENDING_REQUESTS_REQUEST'
// export const PENDING_REQUESTS_SUCCESS = 'PENDING_REQUESTS_SUCCESS'
// export const PENDING_REQUESTS_FAILURE = 'PENDING_REQUESTS_FAILURE'
// export const SUBMITTED_REQUESTS_REQUEST = 'SUBMITTED_REQUESTS_REQUEST'
// export const SUBMITTED_REQUESTS_SUCCESS = 'SUBMITTED_REQUESTS_SUCCESS'
// export const SUBMITTED_REQUESTS_FAILURE = 'SUBMITTED_REQUESTS_FAILURE'
// export const BOOK_ADD = 'BOOK_ADD'
// export const BOOKS_REMOVE = 'BOOKS_REMOVE'
//
// //Request
// export const REQUEST_ADD = 'REQUEST_ADD'
// export const REQUESTS_REMOVE = 'REQUESTS_REMOVE'
// export const CREATE_REQUEST_REQUEST = 'CREATE_REQUEST_REQUEST'
// export const CREATE_REQUEST_SUCCESS = 'CREATE_REQUEST_SUCCESS'
// export const CREATE_REQUEST_FAILURE = 'CREATE_REQUEST_FAILURE'
// export const DELETE_REQUEST_REQUEST = 'DELETE_REQUEST_REQUEST'
// export const DELETE_REQUEST_SUCCESS = 'DELETE_REQUEST_SUCCESS'
// export const DELETE_REQUEST_FAILURE = 'DELETE_REQUEST_FAILURE'
// export const APPROVE_REQUEST_REQUEST = 'APPROVE_REQUEST_REQUEST'
// export const APPROVE_REQUEST_SUCCESS = 'APPROVE_REQUEST_SUCCESS'
// export const APPROVE_REQUEST_FAILURE = 'APPROVE_REQUEST_FAILURE'
// export const REJECT_REQUEST_REQUEST = 'REJECT_REQUEST_REQUEST'
// export const REJECT_REQUEST_SUCCESS = 'REJECT_REQUEST_SUCCESS'
// export const REJECT_REQUEST_FAILURE = 'REJECT_REQUEST_FAILURE'
