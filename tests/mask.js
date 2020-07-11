'use strict'

require('colors')

const crypto = require('crypto')
const createKey = require('../key')

const secretKey = 'my secret key'

const salt = Buffer.alloc(64)

async function main () {
  let min = 100
  let max = 0

  async function report (label, salt) {
    const key = createKey(secretKey)
    await key.salt(salt)
    const length = key._saltedKeyLength * key._hash.length
    let zeros = 0 // Will not change the encrypted message
    for (let offset = 0; offset < length; ++offset) {
      if (key.mask(offset) === 0) {
        ++zeros
      }
    }
    const percent = Math.ceil(100 * zeros / length)
    min = Math.min(min, percent)
    max = Math.max(max, percent)
    if (!label) {
      return
    }
    let formattedPercent = percent.toString().padStart(2, 0) + '%'
    if (percent > 0) {
      formattedPercent = formattedPercent.red
    } else {
      formattedPercent = formattedPercent.green
    }
    console.log(label.magenta, zeros.toString().padStart(6, ' ').gray, '/'.gray, length.toString().padStart(6, ' ').gray, formattedPercent)
  }

  for (let byte = 0; byte < 256; ++byte) {
    salt.fill(byte)
    await report(byte.toString(16).padStart(2, '0'), salt)
  }
  console.log(`min: ${min}% max: ${max}%`.magenta)
  for (let byte = 0; byte < 256; ++byte) {
    salt[byte] = byte
  }
  await report('->', salt)
  for (let byte = 0; byte < 256; ++byte) {
    salt[byte] = 256 - byte
  }
  await report('<-', salt)
  console.log('Random salt...'.gray)
  for (let random = 0; random < 100000; ++random) {
    await report('', crypto.randomBytes(64))
  }
  console.log(`min: ${min}% max: ${max}%`.magenta)
}

main()
