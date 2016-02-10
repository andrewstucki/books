import React, {Component, PropTypes} from 'react'
import { connect } from 'react-redux'

import { books } from '../actions'

class HomePage extends Component {
  constructor(props) {
    super(props)
    this.props.loadBooks()
    this.setFilter = this.setFilter.bind(this)
    this.state = { filter: '' }
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
        <input type="text" onChange={this.setFilter} />
        {this.renderBooks()}
      </div>
    )
  }

  renderBooks() {
    const { booksLoaded } = this.props
    if (!booksLoaded) return <span>Loading...</span>
    return this.filterBooks().map(book => {
      return (
        <div key={book.id}>
          <img src={book.thumbnail} />{book.id}: {book.title}
        </div>
      )
    })
  }
}

function mapStateToProps(state) {
  return {
    booksLoaded: state.cache.booksLoaded,
    books: Object.values(state.cache.books)
  }
}

export default connect(mapStateToProps, {
  loadBooks: books.loadAll
})(HomePage)
