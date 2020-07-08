'use strict'

const CryptoStream = require('./CryptoStream')
const createKey = require('./createKey')
const toBuffer = require('./toBuffer')

async function decrypt (key, buffer) {
  return toBuffer(await decrypt.createStream(key), buffer)
}

class DecryptionStream extends CryptoStream {
  _writeEnd (onwrite) {
    if (this._ended) {
      this._flush()
    } else {
      this._readIfPending()
    }
    onwrite()
  }

  async _buildKey (chunk, onwrite) {
    const lengthForSalt = Math.min(this._saltLength - this._saltOffset, chunk.length)
    chunk.copy(this._salt, this._saltOffset, 0, lengthForSalt)
    this._saltOffset += lengthForSalt
    if (this._saltOffset === this._saltLength) {
      const key = await createKey(this._keyBuffer, this._salt)
      this._key = key
      this._offset = key.salt.readUInt32BE(key.offset - 4)
      if (lengthForSalt < chunk.length) {
        const chunkTail = chunk.subarray(lengthForSalt)
        this._mask(chunkTail)
      }
      this._writeEnd(onwrite)
    } else {
      onwrite()
    }
  }

  _write (chunk, encoding, onwrite) {
    if (!this._key) {
      return this._buildKey(chunk, onwrite)
    }
    this._mask(chunk)
    this._writeEnd(onwrite)
  }

  end () {
    this._ended = true
    if (this._key) {
      this._flush()
    }
    return super.end.apply(this, arguments)
  }

  constructor (keyBuffer = null, saltLength = 0) {
    super()
    this._keyBuffer = keyBuffer
    this._saltLength = saltLength
    this._saltOffset = 0
    if (saltLength) {
      this._salt = Buffer.allocUnsafe(saltLength)
    }
  }
}

decrypt.createStream = async function (key) {
  const { buffer, offset } = await createKey.getBufferAndOffset(key)
  return new DecryptionStream(buffer, offset)
}

decrypt.getPartialStreamInfo = async function (key, from, to) {
  const { buffer, offset } = await createKey.getBufferAndOffset(key)
  from += offset
  to += offset
  return { key: buffer, offset, from, to }
}

decrypt.createPartialStream = async function (info, salt) {
  const stream = new DecryptionStream()
  const key = await createKey(info.key, salt)
  stream._key = key
  stream._offset = info.from - info.offset + key.salt.readUInt32BE(key.offset - 4)
  return stream
}

module.exports = decrypt
