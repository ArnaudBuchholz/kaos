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
      assert.strictEqual(encrypted.length, streamed.length)
      assert.ok(similarity(encrypted, streamed) < 20)
      done()
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
  })

  describe('performance', () => {

    let bigMessage

    before(async () => {
      bigMessage = Buffer.allocUnsafe(1024 * 1024 * 10)
    })

    for (var count = 0; count < 10; ++count) {
      it(`is performant (round ${count + 1})`, async () => {
        const encrypted = await encrypt(key, bigMessage)
        assert.ok(similarity(encrypted, bigMessage) < 20)
      })
    }
  })
})
