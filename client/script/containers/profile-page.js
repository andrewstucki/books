import React, {Component} from 'react'
import { connect } from 'react-redux'

import Typeahead from '../components/typeahead'
import { users, books } from '../actions'

export class ProfilePage extends Component {
  constructor(props) {
    super(props)
    this.updateProfile = this.updateProfile.bind(this)
    this.deleteBook = this.deleteBook.bind(this)
  }

  componentWillMount() {
    this.props.loadBooks(this.props.user.id)
  }

  updateProfile(e) {
    e.preventDefault()
  }

  deleteBook(e) {
    e.preventDefault()
    this.props.deleteBook(e.target.dataset.book)
  }

  render() {
    const { user } = this.props
    return (
      <div className="col-lg-12 user">
        <div className="col-lg-3 user-profile">
          <img src={`http://www.gravatar.com/avatar/${user.gravatarId}?s=200&d=mm`} className='user-avatar' />
          <div className="user-contact">
            <h2 className="user-full-name">{ user.username }</h2>
            <h2 className="user-username">{ user.name || '' }</h2>
          </div>
        </div>
        <div className="col-lg-9">
          <div className="panel panel-default">
            <div className="panel-heading"><h4>User Settings</h4></div>
            <div className="list-group">
              <div className="list-group-item">
                <form className="form-horizontal">
                  <div className="form-group">
                    <label className="col-sm-3 control-label" htmlFor="name">Name</label>
                    <div className="col-sm-9">
                      <input className="form-control" id="name" name="name" type="text" placeholder="John Smith" value={user.name} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="col-sm-3 control-label" htmlFor="username">Username</label>
                    <div className="col-sm-9">
                      <input className="form-control" id="username" name="username" type="text" placeholder="johnsmith" value={user.username} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="col-sm-3 control-label" htmlFor="email">Email</label>
                    <div className="col-sm-9">
                      <input className="form-control" id="email" name="email" type="text" value={user.email} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="col-sm-3 control-label" htmlFor="password">Password</label>
                    <div className="col-sm-9">
                      <input className="form-control" id="password" name="password" type="password" placeholder="********" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="col-sm-3 control-label" htmlFor="confirmation">Password Confirmation</label>
                    <div className="col-sm-9">
                      <input className="form-control" id="confirmation" name="confirmation" type="password" placeholder="********" />
                    </div>
                  </div>
                  <button className="btn btn-success btn-block" onClick={this.updateProfile}>Save Changes</button>
                </form>
              </div>
            </div>
          </div>
          <div className="panel panel-default">
            <div className="panel-heading"><h4>Books</h4></div>
            <div className="list-group">
              <div className="list-group-item">
                <div className="form-group" style={{marginBottom: 0}}>
                  <Typeahead className="form-control" placeholder="Search for books to add..." />
                </div>
              </div>
              { this.renderBooks() }
            </div>
          </div>
        </div>
      </div>
    )
  }

  renderBooks() {
    const { books } = this.props
    return books.map(book => {
      return (
        <div key={book.id} className="list-group-item">
          {book.id}: {book.title} <span data-book={book.id} onClick={this.deleteBook}>x</span>
        </div>
      )
    })
  }
}

function mapStateToProps(state) {
  const { user } = state.auth
  return {
    user: user,
    books: Object.values(state.cache.books).filter(book => book.user.id === user.id)
  }
}

export default connect(mapStateToProps, {
  loadBooks: users.books,
  deleteBook: books.deleteBook
})(ProfilePage)
