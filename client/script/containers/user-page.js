import React, {Component} from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'

import { users, requests } from '../actions'

export class UserPage extends Component {
  constructor(props) {
    super(props)
    this.setFilter = this.setFilter.bind(this)
    this.requestBook = this.requestBook.bind(this)
    this.removeBookRequest = this.removeBookRequest.bind(this)
    this.state = {filter: ''}
  }

  componentWillMount() {
    this.props.loadUser(this.props.id)
    this.props.loadBooks(this.props.id)
  }

  requestBook(e) {
    e.preventDefault(e)
    const book = this.props.books.find(book => book.id === e.currentTarget.dataset.book)
    this.props.createRequest({
      owner: book.user.id,
      book: book.id
    })
  }

  removeBookRequest(e) {
    e.preventDefault(e)
    const request = this.props.requests.find(request => request.book === e.currentTarget.dataset.book)
    this.props.deleteRequest(request.id)
  }

  filterBooks() {
    const {books} = this.props
    if (this.state.filter === '') return books
    return books.filter(book => {
      return book.title.toLowerCase().indexOf(this.state.filter) !== -1 || book.authors.join(" ").toLowerCase().indexOf(this.state.filter) !== -1
    })
  }

  setFilter(e) {
    this.setState({ filter: e.target.value.toLowerCase() })
  }

  render() {
    const { user } = this.props
    if (!user) return <div>Loading...</div>
    return (
      <div>
        <div className="col-lg-12 user-info">
          <img src={`http://www.gravatar.com/avatar/${user.gravatarId}?s=50&d=mm`} className='user-avatar' />
          <h3 className="user-inline">{ user.username }{user.name ? <span className="user-subtext"> ({user.name})</span> : '' }{user.location ? <span className="user-subtext"> - {user.location}</span> : ''}</h3>
        </div>
        <div className="form-group">
          <input type="text" placeholder="Filter books..." onChange={this.setFilter} className="form-control" />
        </div>
        <div className="col-lg-12">
          {this.renderBooks()}
        </div>
      </div>
    )
  }

  renderBooks() {
    const { requests, currentUser, user } = this.props
    const requestedBooks = requests.map(r => r.book)
    return this.filterBooks().map(book => {
      return (
        <div key={book.id} className="col-lg-3 book">
          <div className="book-wrapper" style={{background: `url(${book.thumbnail}) no-repeat`, backgroundSize: 'cover'}}>
            <div className="book-overlay">
              <div className="book-controls">
                { currentUser && currentUser.id && currentUser.confirmed ?
                    ((book.user.id === currentUser.id) ?
                    "" :
                    <i className={
                      requestedBooks.indexOf(book.id) === -1 ?
                      "fa fa-plus-circle add-book" :
                      "fa fa-times-circle remove-book"
                    } data-book={book.id} onClick={
                      requestedBooks.indexOf(book.id) === -1 ?
                      this.requestBook :
                      this.removeBookRequest
                    }></i>) :
                    ""
                }
                <Link to={`/users/${book.user.id}`}><i className="fa fa-user user-book"></i></Link>
                <a href={book.link} target="_blank"><i className="fa fa-info-circle info-book" style={{marginRight: 0}}></i></a>
              </div>
              <div className="book-title">
                {book.title}<br/>
                By: {book.authors.join(", ")}
              </div>
            </div>
          </div>
        </div>
      )
    })
  }
}

function mapStateToProps(state) {
  const user = state.cache.users[state.router.params.id]
  return {
    id: state.router.params.id,
    user: user,
    currentUser: state.auth.user,
    books: user ? Object.values(state.cache.books).filter(book => book.user.id === user.id) : [],
    requests: Object.values(state.cache.submittedRequests).map(r => {return {book: r.book.id, id: r.id}})
  }
}

export default connect(mapStateToProps, {
  loadBooks: users.books,
  loadUser: users.load,
  createRequest: requests.create,
  deleteRequest: requests.deleteRequest
})(UserPage)
