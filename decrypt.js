'use strict'

const CryptoStream = require('./CryptoStream')
const createKey = require('./createKey')
const mask = require('./mask')
const toBuffer = require('./toBuffer')

async function decrypt (key, buffer) {
  return toBuffer(await decrypt.createStream(key), buffer)
}

class DecryptionStream extends CryptoStream {
  _decrypt (chunk) {
    const decrypted = Buffer.from(chunk)
    for (let index = 0; index < chunk.length; ++index) {
      const byteMask = mask(this._key, this._offset++)
      decrypted[index] = decrypted[index] ^ byteMask
    }
    this._chunks.push(decrypted)
  }

  async _createKey (chunk) {
    this._key = await createKey(this._rawKey, this._salt)
    const length = this._saltLength - this._key.offset
    if (length > 0) {
      const unusedSalt = Buffer.allocUnsafe(length)
      this._salt.copy(unusedSalt, 0, this._key.offset, this._key.offset + length)
      this._decrypt(unusedSalt)
    }
  }

  _writeEnd (onwrite) {
    if (this._ended) {
      this._flush()
    } else {
      this._readIfPending()
    }
    onwrite()
  }

  _write (chunk, encoding, onwrite) {
    if (!this._key) {
      const remaining = Math.min(64 - this._saltLength, chunk.length)
      chunk.copy(this._salt, this._saltLength, 0, remaining)
      this._saltLength += remaining
      if (this._saltLength === 64) {
        this._createKey()
          .then(() => {
            if (remaining < chunk.length) {
              const chunkTail = chunk.subarray(remaining)
              this._decrypt(chunkTail)
            }
            this._writeEnd(onwrite)
          })
      }
      return
    }
    this._decrypt(chunk)
    this._writeEnd(onwrite)
  }

  end () {
    this._ended = true
    if (this._key) {
      this._flush()
    }
    return super.end.apply(this, arguments)
  }

  constructor (options) {
    super(options)
    this._salt = Buffer.allocUnsafe(64)
    this._saltLength = 0
  }
}

decrypt.createStream = async function (key) {
  const stream = new DecryptionStream()
  stream._rawKey = key
  return stream
}

module.exports = decrypt
