'use strict'

const assert = require('assert')
const createKey = require('../../createKey')
const encrypt = require('../../encrypt')
const similarity = require('./similarity')

const secretKey = 'my secret key'

describe('encrypt', () => {
  let key
  let message
  let encrypted

  before(async () => {
    key = await createKey(secretKey)
    message = Buffer.from('Hello World !', 'utf8')
    encrypted = Buffer.from(message)
    encrypt(key, encrypted)
  })

  it('encrypts the message', async () => {
    assert.strictEqual(message.length, encrypted.length)
    assert.ok(similarity(message, encrypted) < 20)
  })

  it('supports partial encryption', async () => {
    const concatenated = Buffer.alloc(message.length)
    for (let index = 0; index < message.length; ++index) {
      const partial = Buffer.alloc(1, message[index])
      encrypt(key, partial, index)
      concatenated[index] = partial[0]
    }
    assert.strictEqual(similarity(encrypted, concatenated), 100)
  })
})
