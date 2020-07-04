'use strict'

const { Duplex } = require('stream')
const mask = require('./mask')

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

  _mask (chunk) {
    const buffer = Buffer.from(chunk)
    for (let index = 0; index < chunk.length; ++index) {
      const byteMask = mask(this._key, this._offset++)
      buffer[index] = buffer[index] ^ byteMask
    }
    this._chunks.push(buffer)
  }

  _flush () {
    this._chunks.push(null)
    this._readIfPending()
  }

  constructor () {
    super()
    this._offset = 0
    this._chunks = []
  }
}
