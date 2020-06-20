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
    encrypted = encrypt(key, message)
  })

  it('encrypts the message', async () => {
    assert.ok(similarity(message, encrypted) < 20)
  })

  it('supports partial encryption', async () => {
    const session = encrypt.open(key, message.length)
    const concatenated = Buffer.allocUnsafe(session.header.length + message.length)
    session.header.copy(concatenated)
    message.copy(concatenated, session.header.length)
    for (let index = 0; index < message.length; ++index) {
      const partial = Buffer.alloc(1, message[index])
      encrypt.process(session, partial, index)
      concatenated[session.header.length + index] = partial[0]
    }
    assert.strictEqual(similarity(encrypted, concatenated), 100)
  })
})
