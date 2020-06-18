'use strict'

const mask = require('./mask')

module.exports = (key, buffer, keyOffset = 0) => {
  const length = buffer.length
  for (let index = 0; index < length; ++index) {
    const byteMask = mask(key, keyOffset + index)
    buffer[index] = buffer[index] ^ byteMask
  }
}
