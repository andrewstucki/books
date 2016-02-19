import * as Constants from './constants'
import { api, handleError } from './api'

// this is an authenticated user's received book requests
export function pendingRequests(forceUpdate = false) {
  return (dispatch, getState) => {
    if (getState().cache.pendingRequestsLoaded && !forceUpdate) return null
    dispatch({ type: Constants.PENDING_REQUESTS_REQUEST })
    return api('/requests/pending', { authentication: getState().auth.user.token })
      .then(json => dispatch({ type: Constants.PENDING_REQUESTS_SUCCESS, entity: 'pendingRequests', value: json }))
      .catch(err => handleError(dispatch, Constants.PENDING_REQUESTS_FAILURE, err))
  }
}

// this is an authenticated user's submitted book requests
export function submittedRequests(forceUpdate = false) {
  return (dispatch, getState) => {
    if (getState().cache.submittedRequestsLoaded && !forceUpdate) return null
    dispatch({ type: Constants.SUBMITTED_REQUESTS_REQUEST })
    return api('/requests/submitted', { authentication: getState().auth.user.token })
      .then(json => dispatch({ type: Constants.SUBMITTED_REQUESTS_SUCCESS, entity: 'submittedRequests', value: json }))
      .catch(err => handleError(dispatch, Constants.SUBMITTED_REQUESTS_FAILURE, err))
  }
}

export function create(request) {
  return (dispatch, getState) => {
    dispatch({ type: Constants.CREATE_REQUEST_REQUEST })
    return api('/requests', { method: "post", authentication: getState().auth.user.token }, request)
      .then(json => dispatch({ type: Constants.CREATE_REQUEST_SUCCESS, entity: 'requests', value: json }))
      .catch(err => handleError(dispatch, Constants.CREATE_REQUEST_FAILURE, err))
  }
}

export function deleteRequest(id) {
  return (dispatch, getState) => {
    dispatch({ type: Constants.DELETE_REQUEST_REQUEST })
    return api(`/requests/${id}`, { method: "delete", authentication: getState().auth.user.token })
      .then(json => dispatch({ type: Constants.DELETE_REQUEST_SUCCESS, entity: 'requests', value: json }))
      .catch(err => handleError(dispatch, Constants.DELETE_REQUEST_FAILURE, err))
  }
}

export function approve(id) {
  return (dispatch, getState) => {
    dispatch({ type: Constants.APPROVE_REQUEST_REQUEST })
    return api(`/requests/${id}/accept`, { method: "post", authentication: getState().auth.user.token })
      .then(json => dispatch({ type: Constants.APPROVE_REQUEST_SUCCESS, entity: 'requests', value: json }))
      .catch(err => handleError(dispatch, Constants.APPROVE_REQUEST_FAILURE, err))
  }
}

export function reject(id) {
  return (dispatch, getState) => {
    dispatch({ type: Constants.REJECT_REQUEST_REQUEST })
    return api(`/requests/${id}/reject`, { method: "post", authentication: getState().auth.user.token })
      .then(json => dispatch({ type: Constants.REJECT_REQUEST_SUCCESS, entity: 'requests', value: json }))
      .catch(err => handleError(dispatch, Constants.REJECT_REQUEST_FAILURE, err))
  }
}

export function add(entity, request) {
  return { type: Constants.REQUEST_ADD, entity: entity, value: request }
}

export function remove(entity, requests) {
  return { type: Constants.REQUESTS_REMOVE, entity: entity, value: requests }
}

export function update(entity, request) {
  return remove(entity, [request.id])
}
