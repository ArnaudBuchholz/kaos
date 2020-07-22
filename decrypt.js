'use strict'

const KaosTransform = require('./Transform')

class KaosDecrypt extends KaosTransform {
  async _transform (chunk, encoding, callback) {
    if (!this._key._salt) {
      if (!this._salt) {
        this._saltLength = await this._key._computeSaltLength()
        this._salt = Buffer.allocUnsafe(this._saltLength)
        this._saltOffset = 0
      }
      const lengthForSalt = Math.min(this._saltLength - this._saltOffset, chunk.length)
      chunk.copy(this._salt, this._saltOffset, 0, lengthForSalt)
      this._saltOffset += lengthForSalt
      if (this._saltOffset === this._saltLength) {
        this._key = await this._key.salt(this._salt)
        if (lengthForSalt < chunk.length) {
          const chunkTail = chunk.subarray(lengthForSalt)
          this._mask(chunkTail)
        }
      }
      return callback()
    }
    this._mask(chunk)
    callback()
  }

  constructor (secretKey, range) {
    super(secretKey)
    if (range) {
      this._offset = range.start - range._saltLength
    } else {
      this._offset = 0
    }
  }
}

module.exports = (key, range) => new KaosDecrypt(key, range)
