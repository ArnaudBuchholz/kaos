'use strict'

const crypto = require('crypto')
const assert = require('assert')
const createKey = require('../../createKey')
const mask = require('../../mask')
const { createReadStream } = require('fs')
const { join } = require('path')
const similarity = require('./similarity')

const helloWorld = 'Hello World !'

describe('createKey', () => {
  it('allocates a structure containing the salted key, the hash, the salt and the offset', async () => {
    const { saltedKey, hash, salt, offset } = await createKey(helloWorld)
    assert.ok(!!saltedKey)
    assert.ok(!!hash)
    assert.ok(!!salt)
    assert.strictEqual(typeof offset, 'number')
  })

  it('allocates different hash for the same content', async () => {
    const { hash: hash1 } = await createKey(helloWorld)
    const { hash: hash2 } = await createKey(helloWorld)
    assert.ok(similarity(hash1, hash2) < 20)
  })

  it('allocates the same hash for the same content (with the same salt)', async () => {
    const salt = crypto.randomBytes(64)
    const { hash: hash1 } = await createKey(helloWorld, salt)
    const { hash: hash2 } = await createKey(helloWorld, salt)
    assert.strictEqual(hash1.toString('hex'), hash2.toString('hex'))
  })

  it('can create the key from a file', async () => {
    const salt = crypto.randomBytes(64)
    const keyFile = createReadStream(join(__dirname, '../helloWorld.txt'))
    const { hash: hash1 } = await createKey(keyFile, salt)
    const { hash: hash2 } = await createKey(helloWorld, salt)
    assert.strictEqual(hash1.toString('hex'), hash2.toString('hex'))
  })

  it('generates a hash that is different every time', async () => {
    const salt = crypto.randomBytes(64)
    const { hash: hash1 } = await createKey(helloWorld, salt)
    const { hash: hash2 } = await createKey('hello World !', salt)
    const { hash: hash3 } = await createKey('Hell0 World !', salt)
    const { hash: hash4 } = await createKey('Hell0 World ! ', salt)
    assert.ok(similarity(hash1, hash2) < 20)
    assert.ok(similarity(hash1, hash3) < 20)
    assert.ok(similarity(hash1, hash4) < 20)
  })

  describe('consecutive blocks of 64 bytes do not repeat themselves (< 20%)', () => {
    const length = 64 * 63

    for (let size = 1; size < 128; ++size) {
      it(size.toString(), async () => {
        const key = await createKey(crypto.randomBytes(size))
        const buffer = Buffer.allocUnsafe(length)
        for (let index = 0; index < length; ++index) {
          buffer[index] = mask(key, index)
        }
        for (let index = 0; index < 62; ++index) {
          let offset = index * 64
          const block = buffer.slice(offset, offset + 64)
          assert.strictEqual(block.length, 64)
          while (offset < length - 64) {
            offset += 64
            const next = buffer.slice(offset, offset + 64)
            assert.strictEqual(next.length, 64)
            assert.ok(similarity(block, next) < 20)
          }
        }
      })
    }
  })
})
