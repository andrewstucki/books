import React, {Component, PropTypes} from 'react'
import { connect } from 'react-redux'
import { auth } from '../actions'

class ResendPage extends Component {
  constructor(props) {
    super(props)
    this.resend = this.resend.bind(this)
  }

  resend() {
    this.props.resend()
  }

  render() {
    return <button className="btn btn-block btn-success" onClick={this.resend}>Resend Confirmation Email</button>
  }
}

ResendPage.propTypes = {
  resend: PropTypes.func.isRequired
}

export default connect(null, {
  resend: auth.resend
})(ResendPage)
