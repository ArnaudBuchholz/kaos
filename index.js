#!/usr/bin/env node

'use strict'

const encrypt = require('./encrypt.js')
const decrypt = require('./decrypt.js')

async function pipe ({ transform, source, target, keyParam }) {
  const { createReadStream, createWriteStream, stat } = require('fs')
  const { promisify } = require('util')
  const stream = require('stream')
  const pipeline = promisify(stream.pipeline)
  const statAsync = promisify(stat)
  let key = keyParam
  try {
    const stats = await statAsync(keyParam)
    if (stats.isFile()) {
      key = createReadStream(keyParam)
    }
  } catch (e) {
    key = keyParam
  }
  await pipeline(
    createReadStream(source),
    transform(key),
    createWriteStream(target)
  )
}

if (require.main === module) {
  const [,, mode, source, target, keyParam] = process.argv
  if (!'e,d,encrypt,decrypt'.includes(mode)) {
    throw new Error('Invalid mode')
  }
  if (mode.charAt(0) === 'd') {
    pipe({ transform: decrypt, source, target, keyParam })
  } else {
    pipe({ transform: encrypt, source, target, keyParam })
  }
} else {
  module.exports = {
    key: require('./key'),
    encrypt,
    decrypt
  }
}
