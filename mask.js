'use strict'

function get (buffer, offset) {
  return buffer[offset % buffer.length]
}

module.exports = (key, salt, offset) => {
  const contentByte = get(key.content, offset)
  const hashByte = get(key.hash, offset)
  const saltByte = get(salt, offset)
  return contentByte ^ hashByte ^ saltByte
}
