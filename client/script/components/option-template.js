import React, { Component } from 'react'

export default class OptionTemplate extends Component {
  render() {
    return (
      <div className={`yt-option${ this.props.isSelected ? ' yt-selected-option' : ''}`}>
        {this.renderOption()}
      </div>
    )
  }

  renderOption() {
    const { data, userInputValue } = this.props
    let displayString = data.title
    if (data.authors && data.authors.length > 0) displayString += ` (${data.authors.join(", ")})`
    if (displayString.indexOf(userInputValue) === 0) {
      return (
        <span>
          <strong>
            {userInputValue}
          </strong>
          {displayString.slice(userInputValue.length)}
        </span>
      )
    }

    return (
      <span>
        {displayString}
      </span>
    )
  }
}
