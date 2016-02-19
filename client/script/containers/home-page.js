import React, {Component, PropTypes} from 'react'
import { connect } from 'react-redux'

import { books, requests } from '../actions'

class HomePage extends Component {
  constructor(props) {
    super(props)
    this.setFilter = this.setFilter.bind(this)
    this.requestBook = this.requestBook.bind(this)
    this.removeBookRequest = this.removeBookRequest.bind(this)
    this.state = { filter: '' }
  }

  componentWillMount() {
    this.props.loadBooks()
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
    if (this.state.filter === '') return this.props.books
    return this.props.books.filter(book => {
      return book.title.toLowerCase().indexOf(this.state.filter) !== -1 || book.authors.join(" ").toLowerCase().indexOf(this.state.filter) !== -1
    })
  }

  setFilter(e) {
    this.setState({ filter: e.target.value.toLowerCase() })
  }


  render() {
    return (
      <div>
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
    const { booksLoaded, requests, user } = this.props
    const requestedBooks = requests.map(r => r.book)
    if (!booksLoaded) return <span>Loading...</span>
    return this.filterBooks().map(book => {
      return (
        <div key={book.id} className="col-lg-3 book">
          <div className="book-wrapper" style={{background: `url(${book.thumbnail}) no-repeat`, backgroundSize: 'cover'}}>
            <div className="book-overlay">
              <div className="book-controls">
                { user && user.id ?
                    ((book.user.id === user.id) ?
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
                <i className="fa fa-user user-book"></i>
                <a href={book.link} target="_blank"><i className="fa fa-info-circle info-book"></i></a>
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
  return {
    user: state.auth.user,
    booksLoaded: state.cache.booksLoaded,
    books: Object.values(state.cache.books),
    requests: Object.values(state.cache.submittedRequests).map(r => {return {book: r.book.id, id: r.id}})
  }
}

export default connect(mapStateToProps, {
  loadBooks: books.loadAll,
  createRequest: requests.create,
  deleteRequest: requests.deleteRequest,
  loadSubmittedRequests: requests.submittedRequests
})(HomePage)
