import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { IndexLink, Link } from 'react-router'
import { flash, auth } from '../actions'

import NavLink from '../components/nav-link'

class App extends Component {
  constructor(props) {
    super(props)
    this.handleDismissClick = this.handleDismissClick.bind(this)
    this.doLogout = this.doLogout.bind(this)
    this.preventDefault = this.preventDefault.bind(this)
  }

  doLogout(e) {
    e.preventDefault()
    this.props.logout()
  }

  handleDismissClick(e) {
    e.preventDefault()
    this.props.resetMessage()
  }

  preventDefault(e) {
    e.preventDefault()
  }

  renderMessage() {
    const { flash } = this.props

    if (!flash || !flash.type || !flash.message) {
      return null
    }

    return (
      <p style={{padding: 10}} className={`text-${flash.type}`}>
        <b>{flash.message}</b>
        {' '}
        (<a href="#"
            onClick={this.handleDismissClick}>
          Dismiss
        </a>)
      </p>
    )
  }

  rightNavbar() {
    if (!this.props.isAuthenticated) {
      return (
        <ul className="nav navbar-nav navbar-right">
          <NavLink to='/signup'>Sign Up</NavLink>
          <NavLink to='/login'>Log In</NavLink>
        </ul>
      )
    }
    const username = this.props.currentUser.confirmed ? this.props.currentUser.username : <Link to='/resend'>{this.props.currentUser.username}</Link>
    return (
      <ul className="nav navbar-nav navbar-right">
        <li>
          <p className="navbar-text">Hello {username}</p>
        </li>
        <li>
          <a href="#" onClick={this.doLogout}>Log Out</a>
        </li>
      </ul>
    )
  }

  render() {
    const { children } = this.props

    return (
      <div>
        <div className="navbar navbar-default navbar-static-top">
          <div className="container">
            <div className="navbar-header">
              <button className="navbar-toggle" type="button">
                <span className="sr-only">Toggle navigation</span>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
              </button>
              <IndexLink className="navbar-brand" to="/">Night</IndexLink>
            </div>
            <div className="navbar-collapse collapse" id="navbar-main">
              {this.rightNavbar()}
            </div>
          </div>
        </div>
        {this.renderMessage()}
        <div className="container main-container">
          <div className="row">
            {children}
          </div>
        </div>
      </div>
    )
  }
}

App.propTypes = {
  // Injected by React Redux
  flash: PropTypes.shape({
    type: PropTypes.string,
    message: PropTypes.string
  }),
  resetMessage: PropTypes.func.isRequired,
  // Injected by React Router
  children: PropTypes.node
}

function mapStateToProps(state) {
  return {
    flash: state.message,
    isAuthenticated: state.auth.isAuthenticated,
    currentUser: state.auth.user
  }
}

export default connect(mapStateToProps, {
  resetMessage: flash.resetMessage,
  logout: auth.logout
})(App)
