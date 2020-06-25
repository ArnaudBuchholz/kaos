'use strict'

function get (buffer, offset) {
  return buffer[offset % buffer.length]
}

module.exports = (key, offset) => {
  return get(key.saltedKey, offset) ^ get(key.hash, offset)
}
