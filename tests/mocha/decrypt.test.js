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
  let encrypted

  before(async () => {
    saltedKey = await unsaltedKey.salt()
    const writable = new WritableBuffer()
    await pipeline(
      new ReadableBuffer(message),
      encrypt(saltedKey),
      writable
    )
    encrypted = writable.buffer
  })

  it('decrypts the message (raw key)', async () => {
    const writable = new WritableBuffer()
    const transform = decrypt(literalKey)
    await pipeline(
      new ReadableBuffer(encrypted),
      transform,
      writable
    )
    Object.keys(saltedKey).forEach(property => {
      const value = saltedKey[property]
      if (value instanceof Buffer) {
        assert.strictEqual(transform._key[property].toString('hex'), saltedKey[property].toString('hex'), property)
      } else {
        assert.strictEqual(transform._key[property], saltedKey[property], property)
      }
    })
    assert.strictEqual(writable.writeCount, 1 /* decrypted */)
    const decrypted = writable.buffer
    assert.strictEqual(message.length, decrypted.length)
    assert.strictEqual(similarity(message, decrypted).percent, 100)
  })

  const versions = {
    unsalted: unsaltedKey,
    salted: 0
  }
  Object.keys(versions).forEach(label => {
    it(`supports ${label} key`, async () => {
      let keyVersion
      let buffer
      if (label === 'salted') {
        keyVersion = saltedKey
        buffer = encrypted.slice(await saltedKey._computeSaltLength())
      } else {
        keyVersion = versions[label]
        buffer = encrypted
      }
      const writable = new WritableBuffer()
      await pipeline(
        new ReadableBuffer(buffer),
        decrypt(keyVersion),
        writable
      )
      const result = writable.buffer
      assert.strictEqual(message.length, result.length)
      assert.strictEqual(similarity(message, result).percent, 100)
    })
  })

  it('supports streaming (each byte individually)', async () => {
    const buffers = []
    for (let offset = 0; offset < encrypted.length; ++offset) {
      buffers.push(encrypted.slice(offset, offset + 1))
    }
    const writable = new WritableBuffer()
    const transform = decrypt(literalKey)
    await pipeline(
      new ReadableBuffer(buffers),
      transform,
      writable
    )
    assert.strictEqual(writable.writeCount, message.length)
    const result = writable.buffer
    assert.strictEqual(message.length, result.length)
    assert.strictEqual(similarity(message, result).percent, 100)
  })

  it('supports partial streaming', async () => {
    assert.strictEqual('Hello World !'.substring(6, 11), 'World')
    const range = await saltedKey.byteRange(6, 10)
    const buffer = encrypted.slice(range.start, range.end + 1)
    const writable = new WritableBuffer()
    await pipeline(
      new ReadableBuffer(buffer),
      decrypt(saltedKey, range),
      writable
    )
    assert.strictEqual(writable.writeCount, 1)
    const decryptedMessage = writable.buffer.toString('utf8')
    assert.strictEqual(decryptedMessage, 'World')
  })

  describe('performance & safety', function () {
    this.timeout(0)
    let bigMessage
    let bigEncrypted

    before(async () => {
      bigMessage = Buffer.allocUnsafe(1024 * 1024 * 10)
      const writable = new WritableBuffer()
      await pipeline(
        new ReadableBuffer(bigMessage),
        encrypt(unsaltedKey),
        writable
      )
      bigEncrypted = writable.buffer
    })

    const loops = 10

    it(`is performant (loops=${loops})`, async () => {
      let cumulated = 0
      for (var count = 0; count < loops; ++count) {
        const writable = new WritableBuffer()
        const start = process.hrtime()
        await pipeline(
          new ReadableBuffer(bigEncrypted),
          decrypt(unsaltedKey),
          writable
        )
        const duration = process.hrtime(start)
        cumulated += duration[1] / 1000000
        const result = writable.buffer
        assert.strictEqual(bigMessage.length, result.length)
        assert.strictEqual(similarity(bigMessage, result).percent, 100)
      }
      const ms = cumulated / loops
      const speed = Math.floor(bigMessage.length / (1024 * ms))
      console.log(`        Execution time ${Math.floor(ms)}ms, speed ${speed} Kb/ms`)
    })

    it('is safe (one byte variation, threshold is 20%)', async () => {
      let min = 100
      let max = 0
      for (var byte = 0; byte < 256; ++byte) {
        if (String.fromCharCode(byte) === literalKey[0]) {
          continue
        }
        const alteredLiteralKey = String.fromCharCode(byte) + literalKey.substring(1)
        const writable = new WritableBuffer()
        await pipeline(
          new ReadableBuffer(bigEncrypted),
          decrypt(alteredLiteralKey),
          writable
        )
        const result = writable.buffer
        const percent = similarity(bigMessage, result).percent
        assert.ok(percent < 20)
        min = Math.min(min, percent)
        max = Math.max(max, percent)
      }
      console.log(`        Min: ${min}%, Max: ${max}%`)
    })
  })
})
