'use strict'

const assert = require('assert')
const encrypt = require('../../encrypt')
const decrypt = require('../../decrypt')
const toBuffer = require('../../toBuffer')
const similarity = require('./similarity')

const secretKey = 'my secret key'
const messageToEncrypt = 'Hello World !'

describe('decrypt', () => {
  let message
  let encrypted

  before(async () => {
    message = Buffer.from(messageToEncrypt, 'utf8')
    encrypted = await encrypt(secretKey, message)
  })

  it('decrypts the message', async () => {
    const decrypted = await decrypt(secretKey, encrypted)
    assert.strictEqual(message.length, decrypted.length)
    assert.strictEqual(similarity(message, decrypted), 100)
  })

  it('supports streaming', async () => {
    const stream = await decrypt.createStream(secretKey)
    const promise = toBuffer(stream).then(buffer => {
      const decryptedMessage = buffer.toString('utf8')
      assert.strictEqual(decryptedMessage, messageToEncrypt)
    })
    let index = 0
    function next () {
      if (index < encrypted.length) {
        stream.write(Buffer.alloc(1, encrypted[index]), next)
        ++index
      } else {
        stream.end()
      }
    }
    next()
    return promise
  })

  it('supports partial streaming', async () => {
    const info = await decrypt.getPartialStreamInfo(secretKey, 6, 10)
    const salt = encrypted.slice(0, info.offset)
    const stream = await decrypt.createPartialStream(info, salt)
    const promise = toBuffer(stream).then(buffer => {
      const decryptedMessage = buffer.toString('utf8')
      assert.strictEqual(decryptedMessage, 'World')
    })
    stream.write(encrypted.slice(info.from, info.to), () => stream.end())
    return promise
  })

  describe('performance', () => {
    let bigMessage
    let bigEncrypted

    before(async () => {
      bigMessage = Buffer.allocUnsafe(1024 * 1024 * 10)
      bigEncrypted = await encrypt(secretKey, bigMessage)
    })

    for (var count = 0; count < 10; ++count) {
      it(`is performant (round ${count + 1})`, async () => {
        const start = process.hrtime()
        const decrypted = await decrypt(secretKey, bigEncrypted)
        const duration = process.hrtime(start)
        const ms = duration[1] / 1000000
        const speed = Math.floor(bigMessage.length / (1024 * ms))
        console.info('        Execution time %dms, speed %d Kb/ms', Math.floor(ms), speed)
        assert.strictEqual(similarity(decrypted, bigMessage), 100)
      })
    }
  })
})
