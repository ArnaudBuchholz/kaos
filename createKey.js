'use strict'

const crypto = require('crypto')
const { Readable } = require('stream')

function streamToString (stream) {
  const chunks = []
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

function process (content) {
  const hash = crypto.createHash('sha256')
  hash.update(content)
  return {
    content,
    hash: hash.digest()
  }
}

module.exports = async function createKey (parameter) {
  if (typeof parameter === 'string') {
    return process(parameter)
  }
  if (parameter instanceof Readable) {
    return process(await streamToString(parameter))
  }
  throw new Error('Unsupported parameter')
}
