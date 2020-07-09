'use strict'

const get = (buffer, offset) => buffer[offset % buffer.length]

module.exports = (key, offset) => {
  const keyByte = get(key.saltedKey, offset)
  const hashByte = get(key.hash, offset)
  return keyByte ^ hashByte || keyByte | hashByte || keyByte || hashByte || 85
}
