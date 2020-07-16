'use strict'

const { Transform } = require('stream')
const key = require('./key')

module.exports = class KaosTransform extends Transform {
  _mask (chunk) {
    ++this._nbCallsToMask
    const buffer = Buffer.from(chunk)
    const key = this._key
    for (let index = 0; index < chunk.length; ++index) {
      const byteMask = key.mask(this._offset++)
      buffer[index] = buffer[index] ^ byteMask
    }
    this.push(buffer)
  }

  constructor (secretKey, options) {
    super(options)
    this._nbCallsToMask = 0
    this._key = key(secretKey)
  }
}
