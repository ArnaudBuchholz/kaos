'use strict'

const crypto = require('crypto')
const { Readable } = require('stream')
const toBuffer = require('./toBuffer')

function allocate (key, salt) {
  const hash = crypto.createHash('sha512')
  // hash is 64 bytes long, pad content to minimize the repetition
  const lengthMod64 = key.length % 64
  let paddingLength
  if (lengthMod64 === 0) {
    paddingLenth = 63
  } else {
    paddingLength = 65 - lengthMod64
  }
  const saltedKey = Buffer.allocUnsafe(key.length + paddingLength)
  key.copy(saltedKey)
  salt.copy(saltedKey, key.length, 0, paddingLength)
  hash.update(saltedKey)
  return {
    saltedKey,
    hash: hash.digest(),
    salt
  }
}

module.exports = async function createKey (key, salt = crypto.randomBytes(64)) {
  if (typeof key === 'string') {
    return allocate(Buffer.from(key), salt)
  }
  if (key instanceof Readable) {
    return allocate(await toBuffer(key), salt)
  }
  throw new Error('Unsupported parameter')
}
