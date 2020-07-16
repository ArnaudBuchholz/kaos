'use strict'

const { Readable } = require('stream')

module.exports = class ReadableBuffer extends Readable {
  _read () {
    if (Array.isArray(this._buffer)) {
      this._buffer.forEach(buffer => this.push(buffer))
    } else {
      this.push(this._buffer)
    }
    this.push(null)
  }

  constructor (buffer, options) {
    super(options)
    this._buffer = buffer
  }
}
