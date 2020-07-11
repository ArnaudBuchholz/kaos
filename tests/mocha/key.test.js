'use strict'

const crypto = require('crypto')
const assert = require('assert')
const key = require('../../key')
const { createReadStream } = require('fs')
const { join } = require('path')
const similarity = require('../similarity')

const helloWorld = 'Hello World !'
const hashSimilarityThreshold = 30 // Similarity between hashes


