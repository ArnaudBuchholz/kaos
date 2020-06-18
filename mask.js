'use strict'

function get (buffer, offset) {
  return buffer[offset % buffer.length]
}

module.exports = (key, offset) => {
  const contentByte = get(key.content, offset)
  const hashByte = get(key.hash, offset)
  return contentByte ^ hashByte
}
