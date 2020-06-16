'use strict'

const assert = require('assert')
const createKey = require('../../createKey')
const encrypt = require('../../encrypt')
const similarity = require('./similarity')

const secretKey = 'my secret key'

describe('encrypt', () => {
  it('encrypt the message', async () => {
    const key = await createKey(secretKey)
    const buffer = Buffer.from('Hello World !', 'utf8')
    const encrypted = Buffer.from(buffer)
    encrypt(key, encrypted)
    assert.strictEqual(buffer.length, encrypted.length)
    assert.ok(similarity(buffer, encrypted) < 20)
  })

  it('supports partial encryption', async () => {
    const key = await createKey(secretKey)
    const buffer = Buffer.from('Hello World !', 'utf8')
    const reference = Buffer.from(buffer)
    encrypt(key, reference)
    const concatenated = Buffer.alloc(buffer.length)
    for (let index = 0; index < buffer.length; ++index) {
      const partial = Buffer.alloc(1, buffer[index])
      encrypt(key, partial, index)
      concatenated[index] = partial[0]
    }
    assert.ok(similarity(reference, concatenated) === 100)
  })
})
