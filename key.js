'use strict'

const crypto = require('crypto')
const { Readable } = require('stream')
const toBuffer = require('./toBuffer')

class Key {

  constructor (source, salt) {

  }
}

async function sourceToBuffer (source) {
  if (source instanceof Buffer) {
    return source
  }
  if (typeof source === 'string') {
    return Buffer.from(source)
  }
  if (source instanceof Readable) {
    return await toBuffer(source)
  }
  throw new Error('Unsupported key source')
}

async function computeSaltLength (buffer) {
  // hash is 64 bytes long, pad content to minimize the repetition
  const lengthMod64 = buffer.length % 64
  let saltLength
  if (lengthMod64 < 32) {
    return saltLength = 63 - lengthMod64 /* 63, 62, ..., 32 */
  }
  return saltLength = 1 + lengthMod64 /* 33, 34, ..., 63 */
}

module.exports = (source, salt) => new Key(source, salt)

/*
  const { buffer, saltLength } = await getBufferAndSaltLength(key)
  const saltedKey = Buffer.allocUnsafe(buffer.length + saltLength)
  const key {
    saltedKey,
    saltLength,

    salt () {

    }
  }
}*/