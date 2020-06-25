'use strict'

const assert = require('assert')
const encrypt = require('../../encrypt')
const toBuffer = require('../../toBuffer')
const similarity = require('./similarity')

const secretKey = 'my secret key'

describe('encrypt', () => {
  let message
  let encrypted

  before(async () => {
    message = Buffer.from('Hello World !', 'utf8')
    encrypted = await encrypt(secretKey, message)
  })

  it('encrypts the message', async () => {
    assert.ok(similarity(message, encrypted) < 20)
  })

  it('supports streaming', async () => {
    const stream = await encrypt.createStream(secretKey)
    const promise = toBuffer(stream).then(streamed => {
      assert.strictEqual(encrypted.length, streamed.length)
      assert.ok(similarity(encrypted, streamed) < 20)
    })
    let index = 0
    function next () {
      if (index < message.length) {
        stream.write(new Buffer.alloc(1, message[index]), next)
        ++index
      } else {
        stream.end()
      }
    }
    next()
    return promise
  })

  describe('performance', () => {

    let bigMessage

    before(async () => {
      bigMessage = Buffer.allocUnsafe(1024 * 1024 * 10)
    })

    for (var count = 0; count < 10; ++count) {
      it(`is performant (round ${count + 1})`, async () => {
        const encrypted = await encrypt(secretKey, bigMessage)
        assert.ok(similarity(encrypted, bigMessage) < 20)
      })
    }
  })
})
