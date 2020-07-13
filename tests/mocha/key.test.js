'use strict'

const crypto = require('crypto')
const assert = require('assert')
const key = require('../../key')
const { createReadStream } = require('fs')
const { join } = require('path')
const similarity = require('../similarity')

const mySecretKey = 'My secret key'
const hashSimilarityThreshold = 30 // Similarity between hashes
const blocksSimilarityThreshold = 30 // Similarity between consecutive mask blocks

describe('key', () => {
  describe('definition', () => {
    it('can create a key from a file', async () => {
      const myKey = key(createReadStream(join(__dirname, '../helloWorld.txt')))
      await myKey._computeSaltLength()
      assert.strictEqual(myKey._key.toString('utf8'), 'Hello World !')
    })
  })

  describe('salt', () => {
    it('allocates a structure containing the key, the salt, the hash, the initial offset', async () => {
      const myKey = key(mySecretKey)
      const saltedKey = await myKey.salt()
      assert.strictEqual(saltedKey._key.toString('utf8'), mySecretKey)
      assert.ok(!!saltedKey._salt)
      assert.ok(!!saltedKey._hash)
      assert.strictEqual(typeof saltedKey._initialOffset, 'number')
    })

    it(`allocates different salt (and hash) from the same key (< ${hashSimilarityThreshold}%)`, async () => {
      const myKey = key(mySecretKey)
      const saltedKey1 = await myKey.salt()
      const saltedKey2 = await myKey.salt()
      const saltedKey3 = await myKey.salt()
      const saltedKey4 = await myKey.salt()
      similarity(saltedKey1._hash, saltedKey2._hash, hashSimilarityThreshold)
      similarity(saltedKey1._hash, saltedKey3._hash, hashSimilarityThreshold)
      similarity(saltedKey1._hash, saltedKey4._hash, hashSimilarityThreshold)
    })

    it('supports salt parameter', async () => {
      const myKey = key(mySecretKey)
      const salt = crypto.randomBytes(64)
      const saltedKey1 = await myKey.salt(salt)
      const saltedKey2 = await myKey.salt(salt)
      assert.strictEqual(similarity(saltedKey1._hash, saltedKey2._hash).percent, 100)
    })
  })

  describe('mask', () => {
    it(`makes sure consecutive blocks of 64 bytes do not repeat themselves (< ${blocksSimilarityThreshold}%)`, async function () {
      this.timeout(5000)
      const length = 64 * 63
      for (let size = 1; size <= 128; ++size) {
        const myKey = key(crypto.randomBytes(size))
        const saltedKey = await myKey.salt()
        assert.notStrictEqual(saltedKey._saltedKeyLength % 64, 0)
        assert.strictEqual(saltedKey._saltedKeyLength % 2, 1)
        assert.ok(saltedKey._saltLength >= 32)
        assert.ok(saltedKey._saltLength <= 64)
        const buffer = Buffer.allocUnsafe(length)
        for (let index = 0; index < length; ++index) {
          const mask = saltedKey.mask(index)
          assert.ok(!!mask)
          buffer[index] = saltedKey.mask(index)
        }
        for (let index = 0; index < 62; ++index) {
          let offset = index * 64
          const block = buffer.slice(offset, offset + 64)
          assert.strictEqual(block.length, 64)
          while (offset < length - 64) {
            offset += 64
            const next = buffer.slice(offset, offset + 64)
            assert.strictEqual(next.length, 64)
            similarity(block, next, blocksSimilarityThreshold)
          }
        }
      }
    })
  })
})
