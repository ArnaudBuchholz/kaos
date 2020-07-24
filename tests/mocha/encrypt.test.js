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
    assert.ok(saltLength > 0)
    assert.strictEqual(writable.writeCount, 2 /* salt + encrypted */)
  })

  it('encrypts the message (salted key)', async () => {
    encryptedWithoutSalt = encrypted.slice(saltLength)
    assert.strictEqual(message.length, encryptedWithoutSalt.length)
    similarity(message, encryptedWithoutSalt, 0)
  })

  const versions = {
    literal: literalKey,
    unsalted: unsaltedKey
  }
  Object.keys(versions).forEach(label => {
    const keyVersion = versions[label]
    it(`supports ${label} key`, async () => {
      const writable = new WritableBuffer()
      await pipeline(
        new ReadableBuffer(message),
        encrypt(keyVersion),
        writable
      )
      const result = writable.buffer
      const resultWithoutSalt = result.slice(saltLength)
      assert.strictEqual(message.length, resultWithoutSalt.length)
      similarity(message, resultWithoutSalt, 0)
      similarity(encryptedWithoutSalt, resultWithoutSalt, 50)
    })
  })

  it('generates consistent result when reusing the salted key', async () => {
    const writable = new WritableBuffer()
    await pipeline(
      new ReadableBuffer(message),
      encrypt(saltedKey),
      writable
    )
    const result = writable.buffer
    const resultWithoutSalt = result.slice(saltLength)
    assert.strictEqual(message.length, resultWithoutSalt.length)
    similarity(message, resultWithoutSalt, 0)
    assert.strictEqual(similarity(encryptedWithoutSalt, resultWithoutSalt).percent, 100)
  })

  it('supports streaming (each byte individually)', async () => {
    const buffers = []
    for (let offset = 0; offset < message.length; ++offset) {
      buffers.push(message.slice(offset, offset + 1))
    }
    const writable = new WritableBuffer()
    await pipeline(
      new ReadableBuffer(buffers),
      encrypt(saltedKey),
      writable
    )
    assert.strictEqual(writable.writeCount, 1 /* salt */ + message.length)
    const result = writable.buffer
    const resultWithoutSalt = result.slice(saltLength)
    assert.strictEqual(message.length, resultWithoutSalt.length)
    similarity(message, resultWithoutSalt, 0)
    assert.strictEqual(similarity(encryptedWithoutSalt, resultWithoutSalt).percent, 100)
  })

  it('supports partial streaming', async () => {
    const part1 = new WritableBuffer()
    await pipeline(
      new ReadableBuffer(Buffer.from('Hello', 'utf8')),
      encrypt(saltedKey),
      part1
    )
    const part2 = new WritableBuffer()
    await pipeline(
      new ReadableBuffer(Buffer.from(' World !', 'utf8')),
      encrypt(saltedKey, 5),
      part2
    )
    const result = Buffer.concat([part1.buffer, part2.buffer])
    assert.strictEqual(similarity(encrypted, result).percent, 100)
  })

  describe('performance', function () {
    this.timeout(0)
    let bigMessage

    before(async () => {
      bigMessage = Buffer.allocUnsafe(1024 * 1024 * 10)
    })

    const loops = 10

    it(`is performant (loops=${loops})`, async () => {
      let cumulated = 0
      for (var count = 0; count < 10; ++count) {
        const writable = new WritableBuffer()
        const start = process.hrtime()
        await pipeline(
          new ReadableBuffer(bigMessage),
          encrypt(saltedKey),
          writable
        )
        const duration = process.hrtime(start)
        cumulated += duration[1] / 1000000
        const result = writable.buffer
        const resultWithoutSalt = result.slice(saltLength)
        assert.strictEqual(bigMessage.length, resultWithoutSalt.length)
        similarity(bigMessage, resultWithoutSalt, 0)
      }
      const ms = cumulated / loops
      const speed = Math.floor(bigMessage.length / (1024 * ms))
      console.log(`        Execution time ${Math.floor(ms)}ms, speed ${speed} Kb/ms`)
    })
  })
})
