'use strict'

const crypto = require('crypto')
const { Readable } = require('stream')
const toBuffer = require('./toBuffer')

async function getBuffer (source, sourceType) {
  if (source instanceof Buffer) {
    return source
  }
  if (typeof source === 'string') {
    return Buffer.from(source)
  }
  if (source instanceof Readable) {
    return await toBuffer(source)
  }
  throw new Error(`Unsupported ${sourceType} type`)
}

class Key {
  constructor (source) {
    if (source instanceof Key) {
      Object.keys(source).forEach(property => {
        this[property] = source[property]
      })
    } else {
      this._source = source
    }
  }

  async _getKey () {
    if (!this._key) {
      this._key = await getBuffer(this._source, 'key')
    }
    return this._key
  }

  async _computeSaltLength () {
    if (!this._saltLength) {
      // hash is 64 bytes long, pad content to minimize the repetition
      const lengthMod64 = (await this._getKey()).length % 64
      if (lengthMod64 < 32) {
        this._saltLength = 63 - lengthMod64 /* 63, 62, ..., 32 */
      } else {
        this._saltLength = 1 + lengthMod64 /* 33, 34, ..., 63 */
      }
    }
    return this._saltLength
  }

  async salt (source = crypto.randomBytes(64)) {
    const expectedSaltLength = await this._computeSaltLength()
    const saltedKey = new Key(this)
    saltedKey._salt = await getBuffer(source, 'salt')
    const saltLength = saltedKey._salt.length
    if (saltLength < expectedSaltLength) {
      throw new Error(`Salt too small (expected length is ${expectedSaltLength} bytes)`)
    }
    if (saltLength > expectedSaltLength) {
      saltedKey._salt = saltedKey._salt.slice(0, expectedSaltLength)
    }
    const hash = crypto.createHash('sha512')
    hash.update(saltedKey._key)
    hash.update(saltedKey._salt)
    saltedKey._hash = hash.digest()
    saltedKey._saltedKeyLength = saltedKey._key.length + expectedSaltLength
    saltedKey._initialOffset = saltedKey._salt.readUInt32BE(expectedSaltLength - 4)
    return saltedKey
  }
}

module.exports = source => new Key(source)
