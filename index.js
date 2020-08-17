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
  if (process.argv.length < 6) {
    console.log(`kaos <mode> <source> <target> <key>
where: <mode> = encrypt | decrypt
       <source> = source file path (must exist)
       <target> = target file path (will create)
       <key> = key file path (if exists) | key string`)
    process.exit(-1)
  }
  const [,, mode, source, target, keyParam] = process.argv
  if (!'e,d,encrypt,decrypt'.includes(mode)) {
    console.error('Invalid mode')
    process.exit(-2)
  }
  let promise
  if (mode.charAt(0) === 'd') {
    promise = pipe({ transform: decrypt, source, target, keyParam })
  } else {
    promise = pipe({ transform: encrypt, source, target, keyParam })
  }
  promise.then(() => process.exit(0), reason => {
    console.error(reason.toString())
    process.exit(-3)
  })
} else {
  module.exports = {
    key: require('./key'),
    encrypt,
    decrypt
  }
}
