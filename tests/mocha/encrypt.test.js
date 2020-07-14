'use strict'

const assert = require('assert')
const stream = require('stream')
const { promisify } = require('util')
const pipeline = promisify(stream.pipeline)
const key = require('../../key')
const encrypt = require('../../encrypt')
const ReadableBuffer = require('../ReadableBuffer')
const WritableBuffer = require('../WritableBuffer')
const similarity = require('../similarity')

describe('encrypt', () => {
  const secretKey = key('my secret key')
  let message
  let encrypted
  let saltLength

  before(async () => {
    message = Buffer.from('Hello World !', 'utf8')
    await secretKey.salt()
    const writable = new WritableBuffer()
    await pipeline(
      new ReadableBuffer(message),
      encrypt(secretKey),
      writable
    )
    encrypted = writable.buffer
    saltLength = secretKey._saltLength
  })

  it('encrypts the message', async () => {
    const encryptedWithoutSalt = encrypted.slice(saltLength)
    assert.strictEqual(message.length, encryptedWithoutSalt.length)
    similarity(message, encryptedWithoutSalt, 0)
  })

/*
  it('supports streaming', async () => {
    const stream = await encrypt.createStream(secretKey)
    const promise = toBuffer(stream).then(streamed => {
      assert.strictEqual(encrypted.length, streamed.length)
      similarity(encrypted, streamed, 100)
    })
    let index = 0
    function next () {
      if (index < message.length) {
        stream.write(Buffer.alloc(1, message[index]), next)
        ++index
      } else {
        stream.end()
      }
    }
    next()
    return promise
  })

  describe('performance', function () {
    this.timeout(10000)
    let bigMessage

    before(async () => {
      bigMessage = Buffer.allocUnsafe(1024 * 1024 * 10)
    })

    const loops = 10

    it(`is performant (loops=${loops})`, async () => {
      let cumulated = 0
      for (var count = 0; count < 10; ++count) {
        const start = process.hrtime()
        const encrypted = await encrypt(secretKey, bigMessage)
        const duration = process.hrtime(start)
        cumulated += duration[1] / 1000000
        similarity(bigMessage, encrypted.slice(offset), 0)
      }
      const ms = cumulated / loops
      const speed = Math.floor(bigMessage.length / (1024 * ms))
      console.info('        Execution time %dms, speed %d Kb/ms', Math.floor(ms), speed)
    })
  })
*/
})
