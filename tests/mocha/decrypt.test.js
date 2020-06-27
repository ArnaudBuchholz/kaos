'use strict'

const assert = require('assert')
const encrypt = require('../../encrypt')
const decrypt = require('../../decrypt')
const similarity = require('./similarity')

const secretKey = 'my secret key'

describe('decrypt', () => {
  let message
  let encrypted

  before(async () => {
    message = Buffer.from('Hello World !', 'utf8')
    encrypted = await encrypt(secretKey, message)
  })

  it('decrypts the message', async () => {
    const decrypted = await decrypt(secretKey, encrypted)
    assert.strictEqual(message.length, decrypted.length)
    assert.strictEqual(similarity(message, decrypted), 100)
  })
/*
  it('supports partial decryption', async () => {
    const concatenated = Buffer.alloc(encrypted.length)
    for (let index = 0; index < encrypted.length; ++index) {
      const partial = Buffer.alloc(1, encrypted[index])
      decrypt(key, partial, index)
      concatenated[index] = partial[0]
    }
    assert.ok(similarity(message, concatenated) === 100)
  })
*/
})
