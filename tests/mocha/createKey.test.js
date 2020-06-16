'use strict'

const assert = require('assert')
const createKey = require('../../createKey')
const { createReadStream } = require('fs')
const { join } = require('path')
const similarity = require('./similarity')

const helloWorld = 'Hello World !'

describe('createKey', () => {
  it('allocates a structure containing the content and its hash', async () => {
    const { content, hash } = await createKey(helloWorld)
    assert.strictEqual(content, helloWorld)
    assert.ok(!!hash.toString('hex'))
  })

  it('allocates the same hash for the same content', async () => {
    const { hash: hash1 } = await createKey(helloWorld)
    const { hash: hash2 } = await createKey(helloWorld)
    assert.strictEqual(hash1.toString('hex'), hash2.toString('hex'))
  })

  it('allocates the same hash for the same content', async () => {
    const { hash: hash1 } = await createKey(helloWorld)
    const { hash: hash2 } = await createKey(helloWorld)
    assert.strictEqual(hash1.toString('hex'), hash2.toString('hex'))
  })

  it('can create the key from a file', async () => {
    const keyFile = createReadStream(join(__dirname, '../helloWorld.txt'))
    const { hash: hash1 } = await createKey(keyFile)
    const { hash: hash2 } = await createKey(helloWorld)
    assert.strictEqual(hash1.toString('hex'), hash2.toString('hex'))
  })

  it('generates a hash that is different every time', async () => {
    const { hash: hash1 } = await createKey(helloWorld)
    const { hash: hash2 } = await createKey('hello World !')
    const { hash: hash3 } = await createKey('Hell0 World !')
    const { hash: hash4 } = await createKey('Hell0 World ! ')
    assert.ok(similarity(hash1, hash2) < 20)
    assert.ok(similarity(hash1, hash3) < 20)
    assert.ok(similarity(hash1, hash4) < 20)
  })
})
