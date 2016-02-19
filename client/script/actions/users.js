import * as Constants from './constants'
import { api, handleError } from './api'

export function books(id, forceUpdate = false) {
  return (dispatch, getState) => {
    if (getState().cache.booksLoaded && !forceUpdate) return null
    dispatch({ type: Constants.USER_BOOKS_REQUEST })
    return api(`/users/${id}/books`)
      .then(json => dispatch({ type: Constants.USER_BOOKS_SUCCESS, entity: 'books', value: json }))
      .catch(err => handleError(dispatch, Constants.USER_BOOKS_FAILURE, err))
  }
}

export function load(id) {
  return (dispatch, getState) => {
    if (getState().cache.users[id]) return null
    dispatch({ type: Constants.USER_REQUEST })
    return api(`/users/${id}`)
      .then(json => dispatch({ type: Constants.USER_SUCCESS, entity: 'users', value: json }))
      .catch(err => handleError(dispatch, Constants.USER_FAILURE, err))
  }
}

export function updateProfile(profile) {
  return (dispatch, getState) => {
    dispatch({ type: Constants.UPDATE_PROFILE_REQUEST })
    return api('/profile', { method: 'put', authentication: getState().auth.user.token }, profile)
      .then(json => dispatch({ type: Constants.UPDATE_PROFILE_SUCCESS, entity: 'users', value: json }))
      .catch(err => handleError(dispatch, Constants.UPDATE_PROFILE_FAILURE, err))
  }
}

export function update(user) {
  return { type: Constants.USER_UPDATE, entity: 'users', value: user }
}
