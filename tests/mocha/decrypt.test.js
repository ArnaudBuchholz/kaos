'use strict'

const assert = require('assert')
const createKey = require('../../createKey')
const encrypt = require('../../encrypt')
const decrypt = require('../../decrypt')
const similarity = require('./similarity')

const secretKey = 'my secret key'

describe('decrypt', () => {
  let key
  let message
  let encrypted

  before(async () => {
    key = await createKey(secretKey)
    message = Buffer.from('Hello World !', 'utf8')
    encrypted = Buffer.from(message)
    encrypt(key, encrypted)
  })

  it('decrypts the message', async () => {
    const decrypted = Buffer.from(encrypted)
    decrypt(key, decrypted)
    assert.strictEqual(message.length, encrypted.length)
    assert.strictEqual(similarity(message, decrypted), 100)
  })

  it('supports partial decryption', async () => {
    const concatenated = Buffer.alloc(encrypted.length)
    for (let index = 0; index < encrypted.length; ++index) {
      const partial = Buffer.alloc(1, encrypted[index])
      decrypt(key, partial, index)
      concatenated[index] = partial[0]
    }
    assert.ok(similarity(message, concatenated) === 100)
  })
})
