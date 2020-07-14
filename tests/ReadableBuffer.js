'use strict'

const { Readable } = require('stream')

module.exports = class ReadableBuffer extends Readable {
  _read () {
    this.push(this._buffer)
    this.push(null)
  }

  constructor (buffer, options) {
    super(options)
    this._buffer = buffer
  }
}
