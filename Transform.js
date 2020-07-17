'use strict'

const { Transform } = require('stream')
const key = require('./key')

module.exports = class KaosTransform extends Transform {
  _mask (chunk) {
    const buffer = Buffer.from(chunk)
    const length = chunk.length
    const key = this._key
    const shiftedOffset = key._initialOffset + this._offset
    const saltedKeyLength = key._saltedKeyLength
    let keyOffset = shiftedOffset % saltedKeyLength
    const hashLength = key._hash.length
    let hashOffset = shiftedOffset % key._hash.length
    const unsaltedKeyLength = key._key.length
    let index = 0
    while (length - index) {
      let keyByte
      if (keyOffset < unsaltedKeyLength) {
        keyByte = key._key[keyOffset]
      } else {
        keyByte = key._salt[keyOffset - unsaltedKeyLength]
      }
      const hashByte = key._hash[hashOffset]
      const byteMask = keyByte ^ hashByte || keyByte | hashByte || keyByte || hashByte || 85
      buffer[index] = buffer[index] ^ byteMask
      if (++keyOffset >= saltedKeyLength) {
        keyOffset = 0
      }
      if (++hashOffset >= hashLength) {
        hashOffset = 0
      }
      ++index
    }
    this._offset += length
    this.push(buffer)
  }

  constructor (secretKey, options) {
    super(options)
    this._key = key(secretKey)
  }
}
