'use strict'

require('colors')

const crypto = require('crypto')
const encrypt = require('../encrypt')
const createKey = require('../createKey')
const similarity = require('./similarity')

const secretKey = 'my secret key'
const message = Buffer.from('This is a secret message to hide !', 'utf8')

const salt = Buffer.alloc(64)

async function main () {
  console.log('      ', message.toString('hex').magenta)
  let min = 100
  let max = 0

  async function report (label, salt) {
    const encrypted = await encrypt(secretKey, message, salt)
    const key = await createKey(secretKey, salt)
    const comparable = encrypted.slice(key.offset)
    const match = similarity(message, comparable)
    min = Math.min(min, match.percent)
    max = Math.max(max, match.percent)
    if (!label) {
      return
    }
    const matching = comparable.toString('hex').split('').map((hex, index) => {
      if (match[index]) {
        return hex.red
      }
      return hex.green
    })
    let percent = match.percent.toString().padStart(2, 0) + '%'
    if (match.percent > 10) {
      percent = percent.red
    } else {
      percent = percent.green
    }
    console.log(label.magenta, percent, matching.join(''))
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
