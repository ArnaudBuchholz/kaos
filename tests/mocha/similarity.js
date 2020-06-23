'use strict'

module.exports = function (buffer1, buffer2) {
  const hexBuffer1 = buffer1.toString('hex')
  const hexBuffer2 = buffer2.toString('hex')
  const length = Math.min(hexBuffer1.length, hexBuffer2.length)
  let match = 0
  for (let index = 0; index < length; ++index) {
    if (hexBuffer1[index] === hexBuffer2[index]) {
      ++match
    }
  }
  return Math.floor(100 * match / length) // %
}
