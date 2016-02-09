import React, {Component, PropTypes} from 'react'
import { connect } from 'react-redux'
import Typeahead from '../components/typeahead'

class HomePage extends Component {
  render() {
    return <Typeahead />
  }
}

function mapStateToProps(state) {
  return {}
}

export default connect(mapStateToProps)(HomePage)
