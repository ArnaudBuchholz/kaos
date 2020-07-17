'use strict'

const assert = require('assert')
const stream = require('stream')
const { promisify } = require('util')
const pipeline = promisify(stream.pipeline)
const key = require('../../key')
const encrypt = require('../../encrypt')
const decrypt = require('../../decrypt')
const ReadableBuffer = require('../ReadableBuffer')
const WritableBuffer = require('../WritableBuffer')
const similarity = require('../similarity')

describe('decrypt', () => {
  const literalKey = 'my secret key'
  const unsaltedKey = key(literalKey)
  const message = Buffer.from('Hello World !', 'utf8')
  let saltedKey
  let saltLength
  let encrypted
  let encryptedWithoutSalt

  before(async () => {
    saltedKey = await unsaltedKey.salt()
    const writable = new WritableBuffer()
    await pipeline(
      new ReadableBuffer(message),
      encrypt(saltedKey),
      writable
    )
    encrypted = writable.buffer
    saltLength = saltedKey._saltLength
  })

  it('decrypts the message (raw key)', async () => {
    const writable = new WritableBuffer()
    await pipeline(
      new ReadableBuffer(encrypted),
      decrypt(literalKey),
      writable
    )
    const decrypted = writable.buffer
    assert.strictEqual(message.length, decrypted.length)
    assert.strictEqual(similarity(message, decrypted).percent, 100)
  })

/*
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
    const info = await decrypt.getPartialStreamInfo(secretKey, 6, 11)
    assert.strictEqual(messageToEncrypt.substring(6, 11), 'World')
    const salt = encrypted.slice(0, info.offset)
    const stream = await decrypt.createPartialStream(info, salt)
    const promise = toBuffer(stream).then(buffer => {
      const decryptedMessage = buffer.toString('utf8')
      assert.strictEqual(decryptedMessage, 'World')
    })
    stream.write(encrypted.slice(info.from, info.to), () => stream.end())
    return promise
  })

  describe('performance', function () {
    this.timeout(10000)
    let bigMessage
    let bigEncrypted

    before(async () => {
      bigMessage = Buffer.allocUnsafe(1024 * 1024 * 10)
      bigEncrypted = await encrypt(secretKey, bigMessage)
    })

    const loops = 10

    it(`is performant (loops=${loops})`, async () => {
      let cumulated = 0
      for (var count = 0; count < loops; ++count) {
        const start = process.hrtime()
        const decrypted = await decrypt(secretKey, bigEncrypted)
        const duration = process.hrtime(start)
        cumulated += duration[1] / 1000000
        assert.strictEqual(similarity(decrypted, bigMessage).percent, 100)
      }
      const ms = cumulated / loops
      const speed = Math.floor(bigMessage.length / (1024 * ms))
      console.info('        Execution time %dms, speed %d Kb/ms', Math.floor(ms), speed)
    })
  })
*/
})
