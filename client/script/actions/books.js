import * as Constants from './constants'
import { api, handleError } from './api'

export function search(query) {
  return (dispatch, getState) => {
    dispatch({ type: Constants.BOOK_SEARCH_REQUEST })
    return api(`/books/search/${query}`, { authentication: getState().auth.user.token })
      .then(json => dispatch({ type: Constants.BOOK_SEARCH_SUCCESS, value: json }))
      .catch(err => handleError(dispatch, Constants.BOOK_SEARCH_FAILURE, err))
  }
}

export function loadAll(forceUpdate = false) {
  return (dispatch, getState) => {
    if (getState().cache.booksLoaded && !forceUpdate) return null
    dispatch({ type: Constants.BOOKS_REQUEST })
    return api('/books')
      .then(json => dispatch({ type: Constants.BOOKS_SUCCESS, entity: 'books', value: json }))
      .catch(err => handleError(dispatch, Constants.BOOKS_FAILURE, err))
  }
}

export function create(book) {
  return (dispatch, getState) => {
    dispatch({ type: Constants.CREATE_BOOK_REQUEST })
    return api('/books', { method: "post", authentication: getState().auth.user.token }, book)
      .then(json => dispatch({ type: Constants.CREATE_BOOK_SUCCESS, entity: 'books', value: json }))
      .catch(err => handleError(dispatch, Constants.CREATE_BOOK_FAILURE, err))
  }
}

export function deleteBook(id) {
  return (dispatch, getState) => {
    dispatch({ type: Constants.DELETE_BOOK_REQUEST })
    return api(`/books/${id}`, { method: "delete", authentication: getState().auth.user.token })
      .then(json => dispatch({ type: Constants.DELETE_BOOK_SUCCESS, entity: 'books', value: json }))
      .catch(err => handleError(dispatch, Constants.DELETE_BOOK_FAILURE, err))
  }
}

export function add(book) {
  return { type: Constants.BOOK_ADD, entity: 'books', value: book }
}

export function remove(books) {
  return { type: Constants.BOOKS_REMOVE, entity: 'books', value: books }
}

export function update(book) {
  return { type: Constants.BOOK_UPDATE, entity: 'books', value: book }
}
