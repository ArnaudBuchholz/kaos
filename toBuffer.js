'use strict'

module.exports = readable => {
  return new Promise(resolve => {
    const buffer = []
    readable.on('data', chunk => buffer.push(chunk))
    readable.on('end', () => resolve(Buffer.concat(buffer)))
  })
}
