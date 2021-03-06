import * as Constants from './constants'
import { api, handleError } from './api'

export function login(email, password) {
  return (dispatch, getState) => {
    dispatch({ type: Constants.LOGIN_REQUEST })
    return api(`/session`, { method: "post" }, { email, password })
      .then(json => dispatch({ type: Constants.LOGIN_SUCCESS, value: json }))
      .catch(err => handleError(dispatch, Constants.LOGIN_FAILURE, err))
  }
}

export function logout() {
  return (dispatch, getState) => {
    dispatch({ type: Constants.LOGOUT_REQUEST })
    return api(`/session`, { method: "delete", authentication: getState().auth.user.token })
      .then(json => dispatch({ type: Constants.LOGOUT_SUCCESS, value: json }))
      .catch(err => handleError(dispatch, Constants.LOGOUT_FAILURE, err))
  }
}

export function signup(username, name, email, password, confirmation) {
  return (dispatch, getState) => {
    dispatch({ type: Constants.SIGNUP_REQUEST })
    return api('/signup', { method: "post" }, { username, name, email, password, confirmation })
      .then(json => dispatch({ type: Constants.SIGNUP_SUCCESS, value: json }))
      .catch(err => handleError(dispatch, Constants.SIGNUP_FAILURE, err))
  }
}

export function resend() {
  return (dispatch, getState) => {
    dispatch({ type: Constants.RESEND_REQUEST })
    return api('/confirm/resend', { method: "post", authentication: getState().auth.user.token })
      .then(json => dispatch({ type: Constants.RESEND_SUCCESS, value: json }))
      .catch(err => handleError(dispatch, Constants.RESEND_FAILURE, err))
  }
}
