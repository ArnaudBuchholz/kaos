# &#975;&#592;&oplus;&sopf;

Kaos is a simple but efficient *(and hopefully hard to break)* data encrypter.

* It is tiny with **no** dependencies
* It implements [Node.js' **Transform** streams](https://nodejs.org/api/stream.html#stream_class_stream_transform)
* It enables encryption / decryption by **chunks**
* Two consecutive encryptions with the **same unsalted key** generates **different outputs**

## API

### `Stream.Transform encrypt (key, offset = undefined)`

The `encrypt` API accepts two parameters and returns a [Stream.Transform](https://nodejs.org/api/stream.html#stream_class_stream_transform) instance.

The first parameter is the **encryption key**, it can be :
* A string
* A [Buffer](https://nodejs.org/api/buffer.html#buffer_class_buffer) instance
* A [Stream.Readable](https://nodejs.org/api/stream.html#stream_class_stream_readable) instance
* A key instance *(used for chunks, see below)*

If an unsupported type is used an [Error](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Error) with the message `Unsupported key type` is thrown.

The second parameter must be used **only** when the encryption is done by **chunks** *(see example)*.

```javascript
// Simple encryption

const { promisify } = require('util')
const pipeline = promisify(require('stream').pipeline)
const { createReadStream, createWriteStream } = require('fs')
const { encrypt } = require('@abubu/kaos')

pipeline(
  createReadStream('file to encrypt'),
  encrypt('my secret key'),
  createWriteStream('encrypted file')
)
  .then(() => console.log('Encryption succeeded.'))
  .catch(() => console.log('Encryption failed.'))
```

### Encryption by chunks

If the data to encrypt is **available by chunks** *(for instance : uploaded by packets)*, the **same salted key** must be used for all parts. The start offset of each chunk must be specified for all **but** the first one.

```javascript
// Chunks encryption

const { promisify } = require('util')
const pipeline = promisify(require('stream').pipeline)
const { createReadStream, createWriteStream } = require('fs')
const { key, encrypt } = require('@abubu/kaos')

const myKey = key('my secret key')

myKey.salt()
  // mySaltedKey must be reused for each chunks
  .then(mySaltedKey => pipeline(
    createReadStream('file to encrypt', { start: 0, end: 50 }),
    encrypt(mySaltedKey), // /!\ No offset fo the first chunk
    createWriteStream('encrypted file')
  ))
  .then(() => pipeline(
    createReadStream('file to encrypt', { start: 51 }),
    encrypt(mySaltedKey, 51), // Start offset of this chunk
    createWriteStream('encrypted file', { flags: 'r+', start: 51 })
  ))
  .then(() => console.log('Encryption succeeded.'))
  .catch(() => console.log('Encryption failed.'))
```

### `Stream.Transform decrypt (key, range = undefined)`

The `decrypt` API accepts two parameters and returns a [Stream.Transform](https://nodejs.org/api/stream.html#stream_class_stream_transform) instance.

The first parameter is the encryption key, similar to the `encrypt` API.

The second parameter must be used only when the decryption is done by chunks *(see example)*.

**NOTE :** the decryption algorithm **does not verify** if the data is correctly decrypted.

```javascript
// Simple decryption

const { promisify } = require('util')
const pipeline = promisify(require('stream').pipeline)
const { createReadStream, createWriteStream } = require('fs')
const { decrypt } = require('@abubu/kaos')

pipeline(
  createReadStream('file to decrypt'),
  decrypt('my secret key'),
  createWriteStream('decrypted file')
)
  .then(() => console.log('Decryption succeeded.'))
  .catch(() => console.log('Decryption failed.'))
```

### Decryption by chunks

When only a **specific part** of the message must be decoded, the `key` API provides information about the **ranges to load** from the encrypted data.

The first step consists in reading the **key salt**. Once salted, the key can be **reused** to decode other ranges of the **same encrypted data**.

```javascript
// Chunks decryption

const { promisify } = require('util')
const pipeline = promisify(require('stream').pipeline)
const { createReadStream, createWriteStream } = require('fs')
const { key, decrypt } = require('@abubu/kaos')

const myKey = key('my secret key')

myKey.saltRange()
  .then(range => myKey.salt(createReadStream('file to decrypt', range)))
  // To decode bytes between 1000 and 1100 (inclusively)
  .then(saltedKey => saltedKey.byteRange(1000, 1100))
  .then(range => pipeline(
    createReadStream('file to decrypt', range),
    decrypt(saltedKey, range),
    createWriteStream('decrypted byte range')
  ))
  .then(() => console.log('Decryption succeeded.'))
  .catch(() => console.log('Decryption failed.'))
```
