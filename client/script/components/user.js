import React, {Component, PropTypes} from 'react'

export default class User extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return <div></div>
  }
}

User.propTypes = {
  books: PropTypes.array.isRequired,
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    gravatarId: PropTypes.string.isRequired
  }).isRequired,
}
