'use strict'

module.exports = function (buffer1, buffer2) {
  const hexBuffer1 = buffer1.toString('hex')
  const hexBuffer2 = buffer2.toString('hex')
  const length = Math.min(hexBuffer1.length, hexBuffer2.length)
  const match = hexBuffer1.split('').reduce((count, value, index) => {
    if (value === hexBuffer2[index]) {
      return count + 1
    }
    return count
  }, 0)
  return Math.floor(100 * match / length) // %
}
