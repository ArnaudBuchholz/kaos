'use strict'

function get (buffer, offset) {
  return buffer[offset % buffer.length]
}

module.exports = (key, offset) => {
  const keyByte = get(key.saltedKey, offset)
  const hashByte = get(key.hash, offset)
  const xor = keyByte ^ hashByte
  if (xor !== 0) {
    return xor
  }
  const or = keyByte | hashByte
  if (or !== 0) {
    return or
  }
  return keyByte || hashByte || 85
}
