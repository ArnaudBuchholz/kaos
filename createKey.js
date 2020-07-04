'use strict'

const crypto = require('crypto')
const { Readable } = require('stream')
const toBuffer = require('./toBuffer')

async function keyToBuffer (key) {
  if (key instanceof Buffer) {
    return key
  }
  if (typeof key === 'string') {
    return Buffer.from(key)
  }
  if (key instanceof Readable) {
    return await toBuffer(key)
  }
  throw new Error('Unsupported key type')
}

async function getBufferAndOffset (key) {
  const buffer = await keyToBuffer(key)
  // hash is 64 bytes long, pad content to minimize the repetition
  const lengthMod64 = buffer.length % 64
  let offset
  if (lengthMod64 < 32) {
    offset = 63 - lengthMod64 /* 63, 62, ..., 32 */
  } else {
    offset = 1 + lengthMod64 /* 33, 34, ..., 63 */
  }
  return { buffer, offset }
}

async function createKey (key, salt = crypto.randomBytes(64)) {
  const { buffer, offset } = await getBufferAndOffset(key)
  const hash = crypto.createHash('sha512')
  const saltedKey = Buffer.allocUnsafe(buffer.length + offset)
  buffer.copy(saltedKey)
  salt.copy(saltedKey, buffer.length, 0, offset)
  hash.update(saltedKey)
  return {
    saltedKey,
    hash: hash.digest(),
    salt,
    offset
  }
}

createKey.getBufferAndOffset = getBufferAndOffset

module.exports = createKey
