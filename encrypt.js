'use strict'

const CryptoStream = require('./CryptoStream')
const createKey = require('./createKey')
const mask = require('./mask')
const toBuffer = require('./toBuffer')

async function encrypt (key, buffer) {
  return toBuffer(await encrypt.createStream(key), buffer)
}

class EncryptionStream extends CryptoStream {
  _write (chunk, encoding, onwrite) {
    const encrypted = Buffer.from(chunk)
    for (let index = 0; index < chunk.length; ++index) {
      const byteMask = mask(this._key, this._offset++)
      encrypted[index] = encrypted[index] ^ byteMask
    }
    this._chunks.push(encrypted)
    this._readIfPending()
    onwrite()
  }
}

encrypt.createStream = async function (key) {
  const stream = new EncryptionStream()
  stream._key = await createKey(key)
  stream._chunks.push(stream._key.salt.subarray(0, stream._key.offset))
  return stream
}

module.exports = encrypt
