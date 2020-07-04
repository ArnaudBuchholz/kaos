'use strict'

const CryptoStream = require('./CryptoStream')
const createKey = require('./createKey')
const toBuffer = require('./toBuffer')

async function encrypt (key, buffer) {
  return toBuffer(await encrypt.createStream(key), buffer)
}

class EncryptionStream extends CryptoStream {
  _write (chunk, encoding, onwrite) {
    this._mask(chunk)
    this._readIfPending()
    onwrite()
  }

  end () {
    this._flush()
    return super.end.apply(this, arguments)
  }

  constructor (key) {
    super()
    this._key = key
    this._chunks.push(key.salt.subarray(0, key.offset))
  }
}

encrypt.createStream = async function (key) {
  return new EncryptionStream(await createKey(key))
}

module.exports = encrypt
