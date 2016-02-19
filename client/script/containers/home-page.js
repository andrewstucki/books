import React, {Component, PropTypes} from 'react'
import { connect } from 'react-redux'

import { books } from '../actions'

class HomePage extends Component {
  constructor(props) {
    super(props)
    this.setFilter = this.setFilter.bind(this)
    this.bookOverlay = this.bookOverlay.bind(this)
    this.bookHideOverlay = this.bookHideOverlay.bind(this)
    this.state = { filter: '' }
  }

  componentWillMount() {
    this.props.loadBooks()
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

  bookOverlay(e) {
    let overlay = e.currentTarget.nextSibling
    if (overlay.style.left) return overlay.style.opacity = 1
    let width = overlay.offsetWidth
    overlay.style.width = `${e.currentTarget.offsetWidth}px`
    overlay.style.left = `${(width - e.currentTarget.offsetWidth)/2}px`
    overlay.style.opacity = 1
  }

  bookHideOverlay(e) {
    let overlay = e.currentTarget.nextSibling
    overlay.style.opacity = 0
  }

  render() {
    return (
      <div>
        <div className="form-group">
          <input type="text" placeholder="Filter books" onChange={this.setFilter} className="form-control" />
        </div>
        <div className="col-lg-12">
          {this.renderBooks()}
        </div>
      </div>
    )
  }

  renderBooks() {
    const { booksLoaded, requestedBooks } = this.props
    if (!booksLoaded) return <span>Loading...</span>
    return this.filterBooks().map(book => {
      return (
        <div key={book.id} className="col-lg-3 book">
          <div className="book-wrapper" style={{background: `url(${book.thumbnail}) no-repeat`, backgroundSize: 'cover'}}>
            <div className="book-overlay">
              <div className="book-title">
                {book.title}<br/>
                By: {book.authors.join(", ")}
              </div>
              <div className="book-controls">
                {
                  requestedBooks.indexOf(book.id) === -1 ?
                  <i className="fa fa-plus-circle add-book"></i> :
                  <i className="fa fa-times-circle remove-book"></i>
                }
                <i className="fa fa-question-circle info-book"></i>
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
    booksLoaded: state.cache.booksLoaded,
    books: Object.values(state.cache.books),
    requestedBooks: Object.values(state.cache.submittedRequests).map(r => r.book.id)
  }
}

export default connect(mapStateToProps, {
  loadBooks: books.loadAll
})(HomePage)
