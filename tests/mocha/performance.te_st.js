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
    message = Buffer.allocUnsafe(1024*1024*10)
  })

  for (var count = 0; count < 10; ++count) {
    it('encrypts the message', async () => {
        const encrypted = Buffer.from(message)
        encrypt(key, encrypted)
      })
  }
})
