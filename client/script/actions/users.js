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

export function update(user) {
  return { type: Constants.USER_UPDATE, entity: 'users', value: user }
}
