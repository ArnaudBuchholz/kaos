'use strict'

const encrypt = require('../encrypt')
const createKey = require('../createKey')
const similarity = require('./mocha/similarity')

const secretKey = 'my secret key'
const message = Buffer.from('Hello World !', 'utf8')

const salt = Buffer.alloc(64)

async function main () {
  console.log(message.toString('hex'))
  for (let byte = 0; byte < 256; ++byte) {
    salt.fill(byte)
    const encrypted = await encrypt(secretKey, message, salt)
    const key = await createKey(secretKey, salt)
    const comparable = encrypted.slice(key.offset)
    console.log(byte, similarity(message, comparable), comparable.toString('hex'))
  }
}

main()
