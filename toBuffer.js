'use strict'

module.exports = (stream, dataToWrite) => {
  const promise = new Promise((resolve, reject) => {
    const buffer = []
    stream.on('data', chunk => buffer.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(buffer)))
    stream.on('error', reject)
  })
  if (dataToWrite) {
    stream.write(dataToWrite)
    stream.end()
  }
  return promise
}
