'use strict'

const encrypt = require('../encrypt')
const similarity = require('./mocha/similarity')

const secretKey = 'my secret key'
const message = Buffer.from('Hello World !', 'utf8')

const salt = Buffer.alloc(64)

async function main () {
  for (let byte = 0; byte < 256; ++byte) {
    salt.fill(byte)
    const encrypted = await encrypt(secretKey, message, salt)
    console.log(byte, similarity(message, encrypted))
  }
}

main()
