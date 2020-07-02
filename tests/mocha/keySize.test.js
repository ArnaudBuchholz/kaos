'use strict'

const assert = require('assert')
const crypto = require('crypto')
const encrypt = require('../../encrypt')
const decrypt = require('../../decrypt')
const toBuffer = require('../../toBuffer')
const similarity = require('./similarity')
const fs = require('fs')
const { join } = require('path')

describe('testing different key sizes', () => {
  let message

  before(async () => {
    const file = fs.createReadStream(join(__dirname, '../loremIpsum.txt'))
    return toBuffer(file).then(buffer => {
      message = buffer.toString('utf8')
    })
  })

  for (let size = 1; size < 512; ++size) {
    it(size.toString(), async () => {
      const key = crypto.randomBytes(size)
      const encrypted = await encrypt(key, message)
      assert.ok(similarity(encrypted, message) < 2)
      const decrypted = await decrypt(key, encrypted)
      assert.strictEqual(decrypted.toString('utf8'), message)
    })
  }
})
