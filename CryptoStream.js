'use strict'

const { Duplex } = require('stream')

module.exports = class CryptoStream extends Duplex {
  _read () {
    let count
    while (this._chunks.length) {
      ++count
      if (!this.push(this._chunks.shift())) {
        break
      }
    }
    this._pending = !count
  }

  _readIfPending () {
    if (this._pending) {
      this._read()
    }
  }

  end () {
    this._chunks.push(null)
    this._readIfPending()
    return super.end.apply(this, arguments)
  }

  constructor (options) {
    super(options)
    this._offset = 0
    this._chunks = []
  }
}
