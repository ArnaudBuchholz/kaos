'use strict'

const assert = require('assert')

module.exports = function (buffer1, buffer2, expectedMin = undefined) {
  const length = Math.min(buffer1.length, buffer2.length)
  const match = []
  for (let index = 0; index < length; ++index) {
    match.push(buffer1[index] === buffer2[index])
  }
  match.count = match.reduce((total, matched) => {
    if (matched) {
      return total + 1
    }
    return total
  }, 0)
  match.percent = Math.ceil(100 * match.count / length) // %
  if (expectedMin !== undefined && match.percent > expectedMin) {
    assert(false, `Similarity ${match.percent}% too high, expected ${expectedMin}%`)
  }
  return match
}
