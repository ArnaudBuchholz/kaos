'use strict'

const crypto = require('crypto')
const assert = require('assert')
const key = require('../../key')
const { createReadStream } = require('fs')
const { join } = require('path')
const similarity = require('../similarity')

const mySecretKey = 'My secret key'
const hashSimilarityThreshold = 30 // Similarity between hashes

describe('key', () => {
  describe('definition', () => {
    it('can create a key from a file', async () => {
      const myKey = key(createReadStream(join(__dirname, '../helloWorld.txt')))
      await myKey._computeSaltLength()
      assert.strictEqual(myKey._key.toString('utf8'), 'Hello World !')
    })
  })

  describe('copy', () => {
    it('copies an non buffered key', async () => {
      const myKey = key('my secret key')
      const copyOfKey = key(myKey)
      const buffer = await copyOfKey._getKey()
      assert.strictEqual(buffer.toString('utf8'), 'my secret key')
    })
  })

  describe('salt', () => {
    it('ensures the salted key has a specific length', () => {
      for (let keyLength = 1; keyLength < 256; ++keyLength) {
        const saltLength = key.saltLength(keyLength)
        assert.ok(saltLength > 32)
        assert.strictEqual((keyLength + saltLength) % 64, 63)
      }
    })

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

  describe('ranges', () => {
    it('provides salt range', async () => {
      const myKey = key('my secret key')
      const range = await myKey.saltRange()
      assert.strictEqual(range.start, 0)
      assert.strictEqual(range.end, 49)
    })

    it('provides byte range', async () => {
      const myKey = key('my secret key')
      const range = await myKey.byteRange(100, 150)
      assert.strictEqual(range.start, 150)
      assert.strictEqual(range.end, 200)
    })
  })
})
