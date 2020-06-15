'use strict'

const assert = require('assert')
const createKey = require('../../createKey')
const { createReadStream } = require('fs')
const { join } = require('path')

const helloWorld = 'Hello World !'

function similarity (hash1, hash2) {
  const hexHash1 = hash1.toString('hex')
  const hexHash2 = hash2.toString('hex')
  const length = hexHash1.length
  // assuming both hash have the same length
  const match = hexHash1.split('').reduce((count, value, index) => {
    if (value === hexHash2[index]) {
      return count + 1
    }
    return count
  }, 0)
  return Math.floor(100 * match / length) // %
}

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
