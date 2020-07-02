#!/usr/bin/env node

'use strict'

const encrypt = require('./encrypt.js')
const decrypt = require('./decrypt.js')

async function pipe ({ createStream, source, target, key }) {
  const { createReadStream, createWriteStream, stat } = require('fs')
  const statAsync = require('util').promisify(stat)
  let resolvedKey
  try {
    const stats = await statAsync(key)
    if (stats.isFile()) {
      resolvedKey = createReadStream(key)
    }
  } catch (e) {
    resolvedKey = key
  }
  const processor = await createStream(resolvedKey)
  createReadStream(source).pipe(processor)
  processor.pipe(createWriteStream(target))
}

if (require.main === module) {
  const [,, mode, source, target, key] = process.argv
  if (!'e,d,encrypt,decrypt'.includes(mode)) {
    throw new Error('Invalid mode')
  }
  if (mode.charAt(0) === 'd') {
    pipe({ createStream: decrypt.createStream, source, target, key })
  } else {
    pipe({ createStream: encrypt.createStream, source, target, key })
  }
} else {
  module.exports = {
    encrypt,
    decrypt
  }
}
