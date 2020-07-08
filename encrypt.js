'use strict'

const CryptoStream = require('./CryptoStream')
const createKey = require('./createKey')
const toBuffer = require('./toBuffer')

async function encrypt (key, buffer, salt) {
  return toBuffer(await encrypt.createStream(key, salt), buffer)
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
    this._offset = key.salt.readUInt32BE(key.offset - 4)
  }
}

encrypt.createStream = async function (key, salt) {
  return new EncryptionStream(await createKey(key, salt))
}

module.exports = encrypt
