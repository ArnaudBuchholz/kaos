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
      this._saltLength = key.saltLength((await this._getKey()).length)
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

  async saltRange () {
    return {
      start: 0,
      end: await this._computeSaltLength() - 1
    }
  }

  async byteRange (start, end) {
    const _saltLength = await this._computeSaltLength()
    return {
      start: _saltLength + start,
      end: _saltLength + end,
      _saltLength
    }
  }
}

const key = source => new Key(source)

key.saltLength = keyLength => {
  const min = 63 - keyLength % 64
  if (min < 32) {
    return min + 64
  }
  return min
}

module.exports = key
