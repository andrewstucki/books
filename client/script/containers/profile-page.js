import React, {Component} from 'react'
import { connect } from 'react-redux'

import Typeahead from '../components/typeahead'
import { users, books } from '../actions'

export class ProfilePage extends Component {
  constructor(props) {
    super(props)
    this.props.loadBooks(this.props.user.id)
    this.deleteBook = this.deleteBook.bind(this)
  }

  deleteBook(e) {
    e.preventDefault()
    this.props.deleteBook(e.target.dataset.book)
  }

  render() {
    return (
      <div>
        <Typeahead />
        { this.renderBooks() }
      </div>
    )
  }

  renderBooks() {
    const { books } = this.props
    return books.map(book => {
      return (
        <div key={book.id}>
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
