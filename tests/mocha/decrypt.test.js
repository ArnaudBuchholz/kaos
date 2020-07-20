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
      if (label === 'salted') {
        keyVersion = saltedKey
      } else {
        keyVersion = versions[label]
      }
      const writable = new WritableBuffer()
      await pipeline(
        new ReadableBuffer(encrypted),
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

  /*
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
*/

  describe('performance', function () {
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
      console.info('        Execution time %dms, speed %d Kb/ms', Math.floor(ms), speed)
    })
  })
})
