
import React from 'react'
import { Route, IndexRoute } from 'react-router'

import App from './containers/app'
import HomePage from './containers/home-page'
import LoginPage from './containers/login-page'
import SignupPage from './containers/signup-page'
import ResendPage from './containers/resend-page'
import ProfilePage from './containers/profile-page'
import UserPage from './containers/user-page'
import BooksPage from './containers/books-page'

import { requireAuth, noAuth } from './components/auth'

export default (
  <Route path='/' component={App}>
    <IndexRoute component={HomePage} />
    <Route path='/login' name='login' component={noAuth(LoginPage)} />
    <Route path='/signup' name='signup' component={noAuth(SignupPage)} />
    <Route path='/resend' name='resend' component={requireAuth(ResendPage, false)} />
    <Route path='/profile' name='profile' component={requireAuth(ProfilePage, true)} />
    <Route path='/users/:id' name='user' component={UserPage} />
    <Route path='/books' name='books' component={BooksPage} />
  </Route>
)
