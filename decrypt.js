'use strict'

const KaosTransform = require('./Transform')

class KaosDecrypt extends KaosTransform {
  async _transform (chunk, encoding, callback) {
    if (!this._salt) {
      this._saltLength = await this._key._computeSaltLength()
      this._salt = Buffer.allocUnsafe(this._saltLength)
      this._saltOffset = 0
    }
    if (!this._key._salt) {
      const lengthForSalt = Math.min(this._saltLength - this._saltOffset, chunk.length)
      chunk.copy(this._salt, this._saltOffset, 0, lengthForSalt)
      this._saltOffset += lengthForSalt
      if (this._saltOffset === this._saltLength) {
        this._key = await this._key.salt(this._salt)
        this._offset = 0
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
}

/*
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
*/

function decrypt (key) {
  return new KaosDecrypt(key)
}

module.exports = decrypt
