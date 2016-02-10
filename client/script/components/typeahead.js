import React, { Component } from 'react'
import { connect } from 'react-redux'
import TypeaheadComponent from 'react-typeahead-component'

import { books } from '../actions'
import OptionTemplate from './option-template'

export class Typeahead extends Component {
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleOptionChange = this.handleOptionChange.bind(this)
    this.handleOptionClick = this.handleOptionClick.bind(this)
    this.state = { inputValue: '' }
  }

  render() {
    return (
      <TypeaheadComponent
        inputValue={this.state.inputValue}
        options={this.props.options}
        onChange={this.handleChange}
        optionTemplate={OptionTemplate}
        onOptionChange={this.handleOptionChange}
        onOptionClick={this.handleOptionClick} />
    )
  }

  handleChange(event) {
    const { search } = this.props
    const { value } = event.target
    this.setInputValue(value)
    if (this.searchRequest) clearTimeout(this.searchRequest)

    if (value === "") return

    this.searchRequest = setTimeout(() => search(value), 800)
  }

  handleOptionChange(event, option) {
    this.props.createBook(option)
    this.setInputValue('')
  }

  handleOptionClick(event, option) {
    this.props.createBook(option)
    this.setInputValue('')
  }

  setInputValue(value) {
    this.setState({
      inputValue: value
    })
  }
}

function mapStateToProps(state) {
  return {
    options: state.bookOptions
  }
}

export default connect(mapStateToProps, {
  search: books.search,
  createBook: books.create
})(Typeahead)
