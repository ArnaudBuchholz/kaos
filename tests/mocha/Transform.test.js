'use strict'

const crypto = require('crypto')
const assert = require('assert')
const key = require('../../key')
const KaosTransform = require('../../Transform')
const similarity = require('../similarity')

const blocksSimilarityThreshold = 30 // Similarity between consecutive mask blocks

describe('Transform', () => {
  describe('mask', () => {
    it(`makes sure consecutive blocks of 64 bytes do not repeat themselves (< ${blocksSimilarityThreshold}%)`, async function () {
      this.timeout(0)
      const length = 64 * 63
      for (let size = 1; size <= 128; ++size) {
        const myKey = key(crypto.randomBytes(size))
        const saltedKey = await myKey.salt()
        assert.notStrictEqual(saltedKey._saltedKeyLength % 64, 0)
        assert.strictEqual(saltedKey._saltedKeyLength % 2, 1)
        assert.ok(saltedKey._saltLength >= 32)
        assert.ok(saltedKey._saltLength <= 64)
        const message = Buffer.alloc(length, 0)
        const transform = new KaosTransform(saltedKey)
        transform._offset = 0
        let buffer
        transform.push = chunk => {
          buffer = chunk
        }
        transform._mask(message)
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
