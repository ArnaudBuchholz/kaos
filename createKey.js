'use strict'

const crypto = require('crypto')
const { Readable } = require('stream')
const toBuffer = require('./toBuffer')

function allocate (key, salt) {
  const hash = crypto.createHash('sha512')
  // hash is 64 bytes long, pad content to minimize the repetition
  const lengthMod64 = key.length % 64
  let offset
  if (lengthMod64 < 32) {
    offset = 63 - lengthMod64 /* 63, 62, ..., 32 */
  } else {
    offset = 1 + lengthMod64 /* 33, 34, ..., 63 */
  }
  const saltedKey = Buffer.allocUnsafe(key.length + offset)
  key.copy(saltedKey)
  salt.copy(saltedKey, key.length, 0, offset)
  hash.update(saltedKey)
  return {
    saltedKey,
    hash: hash.digest(),
    salt,
    offset
  }
}

module.exports = async function createKey (key, salt = crypto.randomBytes(64)) {
  if (typeof key === 'string') {
    return allocate(Buffer.from(key), salt)
  }
  if (key instanceof Buffer) {
    return allocate(key, salt)
  }
  if (key instanceof Readable) {
    return allocate(await toBuffer(key), salt)
  }
  throw new Error('Unsupported parameter')
}
