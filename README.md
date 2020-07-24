# &#975;&#592;&oplus;&#5835;

A simple but efficient *(and hopefully hard to break)* data encrypter.

* Tiny, no dependencies
* Streamable (based on [Node.js' Transform streams](https://nodejs.org/api/stream.html#stream_class_stream_transform))
* Encryption / Decryption may be done by chunks
* Two consecutive encryptions with the same unsalted key generates different results

## API

### `Stream.Transform encrypt (key, offset = undefined)`

The `encrypt` API accepts two parameters and returns a [Stream.Transform](https://nodejs.org/api/stream.html#stream_class_stream_transform) instance.

The first parameter contains the encryption key, it can be :
* A string
* A [Buffer](https://nodejs.org/api/buffer.html#buffer_class_buffer) instance
* A [Stream.Readable](https://nodejs.org/api/stream.html#stream_class_stream_readable) instance
* A key instance (see below)

If an unsupported type is used an [Error](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Error) with the message `Unsupported key type` is thrown.

The second parameter is optional and should be used only when the encryption is done by chunks.

```javascript
// Simple encryption

const { promisify } = require('util')
const pipeline = promisify(require('stream').pipeline)
const { createReadStream, createWriteStream } = require('fs')
const { encrypt } = require('kaos')

pipeline(
  createReadStream('file to encrypt'),
  encrypt('my secret key'),
  createWriteStream('encrypted file')
)
  .then(() => console.log('Encryption succeeded.'))
  .catch(() => console.log('Encryption failed.'))
```

### Encryption of chunks

To realize chunks encryption, the **same salted key** must be used for all operations. The start offset of each chunk must be specified for all **but** the first one.

```javascript
// Chunks encryption

const { promisify } = require('util')
const pipeline = promisify(require('stream').pipeline)
const { createReadStream, createWriteStream } = require('fs')
const { key, encrypt } = require('kaos')

const myKey = key('my secret key')

myKey.salt()
  // mySaltedKey must be reused for each chunks
  .then(mySaltedKey => pipeline(
    createReadStream('file to encrypt', { start: 0, end: 50 }),
    encrypt(mySaltedKey), // No offset specified
    createWriteStream('encrypted file')
  ))
  .then(() => pipeline(
    createReadStream('file to encrypt', { start: 51 }),
    encrypt(mySaltedKey, 51), // Start offset of chunk
    createWriteStream('encrypted file', { flags: 'r+', start: 51 })
  ))
  .then(() => console.log('Encryption succeeded.'))
  .catch(() => console.log('Encryption failed.'))
```

### `Stream.Transform decrypt (key, range)`

The `decrypt` API accepts two parameters and returns a [Stream.Transform](https://nodejs.org/api/stream.html#stream_class_stream_transform) instance.

The first parameter contains the encryption key, as for `encrypt`.

The second parameter is optional and should be used only when the decryption is done by chunks (see below).

**Note** that the decryption algorithm **does not verify** if the data is correctly decrypted.

```javascript
// Simple decryption

const { promisify } = require('util')
const pipeline = promisify(require('stream').pipeline)
const { createReadStream, createWriteStream } = require('fs')
const { decrypt } = require('kaos')

pipeline(
  createReadStream('file to decrypt'),
  decrypt('my secret key'),
  createWriteStream('decrypted file')
)
  .then(() => console.log('Decryption succeeded.'))
  .catch(() => console.log('Decryption failed.'))
```

### Decryption for a given byte range

It is also possible to decrypt partially the data using the `key` API that provides information about the ranges to load from the encrypted data.
Once salted, the key information can be reused to decode other ranges of the same encrypted data.

```javascript
// Chunks decryption

const { promisify } = require('util')
const pipeline = promisify(require('stream').pipeline)
const { createReadStream, createWriteStream } = require('fs')
const { key, decrypt } = require('kaos')

const myKey = key('my secret key')

myKey.saltRange()
  .then(range => myKey.salt(createReadStream('file to decrypt', range)))
  .then(saltedKey => saltedKey.byteRange(1000, 1100))
  .then(range => pipeline(
    createReadStream('file to decrypt', range),
    decrypt(saltedKey, range),
    createWriteStream('decrypted byte range')
  ))
  .then(() => console.log('Decryption succeeded.'))
  .catch(() => console.log('Decryption failed.'))
```
