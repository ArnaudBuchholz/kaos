'use strict'

const { Duplex } = require('stream')
const createKey = require('./createKey')
const mask = require('./mask')
const toBuffer = require('./toBuffer')

async function encrypt (key, buffer) {
  const stream = await encrypt.createStream(key)
  const promise = toBuffer(stream)
  stream.write(buffer)
  stream.end()
  return promise
}

class EncryptionStream extends Duplex {
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

encrypt.createStream = async function (key) {
  const stream = new EncryptionStream()
  stream._key = await createKey(key)
  stream._chunks.push(stream._key.salt)
  return stream
}

module.exports = encrypt
