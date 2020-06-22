'use strict'

const assert = require('assert')
const createKey = require('../../createKey')
const encrypt = require('../../encrypt')
const toBuffer = require('../../toBuffer')
const similarity = require('./similarity')

const secretKey = 'my secret key'

describe('encrypt', () => {
  let key
  let message
  let encrypted

  before(async () => {
    key = await createKey(secretKey)
    message = Buffer.from('Hello World !', 'utf8')
    encrypted = await encrypt(key, message)
  })

  it('encrypts the message', async () => {
    assert.ok(similarity(message, encrypted) < 20)
  })

  it('supports streaming', done => {
    const stream = encrypt.createStream(key)
    toBuffer(stream).then(streamed => {
      assert.strictEqual(similarity(encrypted, streamed), 100)
      done()
    })
    let index = 0
    function next () {
      if (index < message.length) {
        stream.write(message[index], next)
        ++index
      } else {
        stream.end()
      }
    }
    next()
  })
})
