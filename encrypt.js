'use strict'

const crypto = require('crypto')

const mask = require('./mask')

function encrypt (key, buffer) {
  const session = open(key, buffer.length)
  const encrypted = Buffer.allocUnsafe(session.header.length + message.length)
  session.header.copy(concatenated)
  message.copy(concatenated, session.header.length)
  process(session, { concatenated, offset: 0, length: buffer.length }, 0)
}

encrypt.open = function (key, length) {
  const header = crypto.randomBytes(32)
  const session = {
    key,
    header,
    length
  }
}

encrypt.process = function (session, { buffer, offset, length }, absoluteOffset = 0) {
  for (let index = 0; index < length; ++index) {
    const byteMask = mask(session, absoluteOffset + index)
    buffer[offset + index] = buffer[offset + index] ^ byteMask
  }
}

module.exports = encrypt
