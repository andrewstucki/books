import React, { Component } from 'react'
import { connect } from 'react-redux'
import { pushState } from 'redux-router'

function generateAuthWrapper(Component, authCheck, renderCheck) {
  class AuthenticatedComponent extends Component {
    componentWillMount() {
      authCheck(this.props)
    }

    componentWillReceiveProps(nextProps) {
      authCheck(nextProps)
    }

    render() {
      let node = ""
      if (renderCheck(this.props)) node = <Component {...this.props} />
      return ( <div>{node}</div> )
    }
  }

  const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    user: state.auth.user
  })

  return connect(mapStateToProps)(AuthenticatedComponent)
}

export function requireAuth(Component, confirmation) {
  return generateAuthWrapper(Component, function(props) {
    if (typeof confirmation === 'undefined' && !props.isAuthenticated) return props.dispatch(pushState(null, '/login'))
    if (!props.isAuthenticated || (typeof confirmation !== 'undefined' && !confirmation && props.user.confirmed)) return props.dispatch(pushState(null, '/login'))
    if (typeof confirmation !== 'undefined' && props.isAuthenticated && confirmation && !props.user.confirmed) return props.dispatch(pushState(null, '/resend'))
  }, function(props) {
    if (typeof confirmation === 'undefined') return props.isAuthenticated
    return props.isAuthenticated && (!confirmation || props.user.confirmed)
  })
}

export function noAuth(Component) {
  return generateAuthWrapper(Component, function(props) {
    if (props.isAuthenticated) {
      props.dispatch(pushState(null, '/profile'))
    }
  }, function(props) {
    return !props.isAuthenticated
  })
}
