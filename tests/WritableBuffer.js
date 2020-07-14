'use strict'

const { Writable } = require('stream')

module.exports = class WritableBuffer extends Writable {
  _write (chunk, encoding, onwrite) {
    this._buffer = Buffer.concat([this._buffer, chunk])
    onwrite()
  }

  get buffer () {
    return this._buffer
  }

  constructor (buffer, options) {
    super(options)
    this._buffer = Buffer.from('')
  }
}
