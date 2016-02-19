import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { IndexLink, Link } from 'react-router'
import { NavDropdown, MenuItem } from 'react-bootstrap'

import { flash, auth, requests } from '../actions'

import NavLink from '../components/nav-link'

class App extends Component {
  constructor(props) {
    super(props)
    this.handleDismissClick = this.handleDismissClick.bind(this)
    this.doLogout = this.doLogout.bind(this)
    this.removeBookRequest = this.removeBookRequest.bind(this)
    this.acceptBookRequest = this.acceptBookRequest.bind(this)
    this.rejectBookRequest = this.rejectBookRequest.bind(this)
    this.preventDefault = this.preventDefault.bind(this)
  }

  componentWillMount() {
    if (this.props.isAuthenticated && this.props.currentUser.confirmed) {
      this.props.loadPendingRequests()
      this.props.loadSubmittedRequests()
    }
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

  removeBookRequest(e) {
    e.preventDefault()
    this.props.deleteRequest(e.currentTarget.dataset.request)
  }

  acceptBookRequest(e) {
    e.preventDefault()
    this.props.acceptRequest(e.currentTarget.dataset.request)
  }

  rejectBookRequest(e) {
    e.preventDefault()
    this.props.rejectRequest(e.currentTarget.dataset.request)
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

  renderSubmittedNotifications() {
    const { submittedRequests } = this.props
    const notificationIcon = <i className="fa fa-ellipsis-h"></i>
    if (submittedRequests.length === 0) {
      return (
        <NavDropdown eventKey={4} title={notificationIcon} noCaret id="basic-nav-dropdown">
          <MenuItem eventKey={4.1}>No Submitted Requests</MenuItem>
        </NavDropdown>
      )
    }

    const submitted = submittedRequests.map(request => {
      return <MenuItem key={request.id}><i className="fa fa-times-circle" onClick={this.removeBookRequest} data-request={request.id}></i> {request.book.title}</MenuItem>
    })
    return (
      <NavDropdown eventKey={4} title={notificationIcon} noCaret={true} id="basic-nav-dropdown">
        {submitted}
      </NavDropdown>
    )
  }

  renderPendingNotifications() {
    const { pendingRequests } = this.props
    const notificationIcon = <i className="fa fa-bell"></i>
    if (pendingRequests.length === 0) {
      return (
        <NavDropdown eventKey={3} title={notificationIcon} noCaret id="basic-nav-dropdown">
          <MenuItem eventKey={3.1}>No Pending Requests</MenuItem>
        </NavDropdown>
      )
    }

    const pending = pendingRequests.map(request => {
      return (
        <MenuItem key={request.id}>
          <i className="fa fa-check-circle" onClick={this.acceptBookRequest} data-request={request.id}></i>
          <i className="fa fa-minus-circle" onClick={this.rejectBookRequest} data-request={request.id}></i>
          {request.book.title}
        </MenuItem>
      )
    })
    return (
      <NavDropdown eventKey={3} title={notificationIcon} noCaret={true} id="basic-nav-dropdown">
        {pending}
      </NavDropdown>
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
    const username = this.props.currentUser.confirmed ? <Link to='/profile'>{this.props.currentUser.username}</Link> : <Link to='/resend'>{this.props.currentUser.username}</Link>
    return (
      <ul className="nav navbar-nav navbar-right">
        {this.renderSubmittedNotifications()}
        {this.renderPendingNotifications()}
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
              <IndexLink className="navbar-brand" to="/"><i className="fa fa-book"></i> Books!</IndexLink>
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
    currentUser: state.auth.user,
    pendingRequests: Object.values(state.cache.pendingRequests),
    submittedRequests: Object.values(state.cache.submittedRequests),
  }
}

export default connect(mapStateToProps, {
  resetMessage: flash.resetMessage,
  logout: auth.logout,
  loadPendingRequests: requests.pendingRequests,
  loadSubmittedRequests: requests.submittedRequests,
  deleteRequest: requests.deleteRequest,
  acceptRequest: requests.approve,
  rejectRequest: requests.reject
})(App)
