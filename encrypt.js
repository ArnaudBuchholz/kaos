'use strict'

const KaosTransform = require('./Transform')

class KaosEncrypt extends KaosTransform {
  async _transform (chunk, encoding, callback) {
    if (!this._key._salt) {
      this._key = await this._key.salt()
    }
    if (this._offset === undefined) {
      this._offset = 0
      this.push(this._key._salt)
    }
    this._mask(chunk)
    callback()
  }

  constructor (secretKey, offset) {
    super(secretKey)
    this._offset = offset
  }
}

module.exports = (key, offset) => new KaosEncrypt(key, offset)
