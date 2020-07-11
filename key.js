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
    this._source = source
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
    const saltLength = await this._computeSaltLength()
    this._salt = await getBuffer(source, 'salt')
    if (this._salt.length < saltLength) {
      throw new Error(`Salt too small (expected length is ${saltLength} bytes)`)
    }
    if (this._salt.length > saltLength) {
      this._salt = this._salt.slice(0, saltLength)
    }
    const hash = crypto.createHash('sha512')
    hash.update(this._key)
    hash.update(this._salt)
    this._hash = hash.digest()
    this._saltedKeyLength = this._key.length + saltLength
    this._initialOffset = this._salt.readUInt32BE(saltLength - 4)
  }

  mask (offset) {
    const shiftedOffset = this._initialOffset + offset
    const keyOffset = shiftedOffset % this._saltedKeyLength
    const keyLength = this._key.length
    let keyByte
    if (keyOffset < keyLength) {
      keyByte = this._key[keyOffset]
    } else {
      keyByte = this._salt[keyOffset - keyLength]
    }
    const hashByte = this._hash[shiftedOffset % this._hash.length]
    return keyByte ^ hashByte || keyByte | hashByte || keyByte || hashByte || 85
  }
}

module.exports = source => new Key(source)
