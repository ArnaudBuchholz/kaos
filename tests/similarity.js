'use strict'

const assert = require('assert')

module.exports = function (buffer1, buffer2, expectedMin = undefined) {
  const hexBuffer1 = buffer1.toString('hex')
  const hexBuffer2 = buffer2.toString('hex')
  const length = Math.min(hexBuffer1.length, hexBuffer2.length)
  const match = []
  for (let index = 0; index < length; ++index) {
    match.push(hexBuffer1[index] === hexBuffer2[index])
  }
  match.count = match.reduce((total, matched) => {
    if (matched) {
      return total + 1
    }
    return total
  }, 0)
  match.percent = Math.floor(100 * match.count / length) // %
  if (expectedMin && match.percent > expectedMin) {
    assert(false, `Similarity ${match.percent}% too high, expected ${expectedMin}%`)
  }
  return match
}
