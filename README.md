# kaos

A simple but efficient *(and hopefully hard to break)* data encrypter.

## Constraints

* Streamable
* Decryption may start from almost any byte
* Two consecutive encoding with the same key generates different encrypted results

## Rational

Let's consider the message `"Hello World !"`

If we associate each letter to its ASCII code we get a bit array :

|H|e|l|l|o| |W|o|r|l|d| |!|
|-|-|-|-|-|-|-|-|-|-|-|-|-|
|01001000|01100101|01101100|01101100|01101111|00100000|01010111|01101111|01110010|01101100|01100100|00100000|00100001|

The same way, the key `"secret"` can be represented as the following bit array :

|s|e|c|r|e|t|
|-|-|-|-|-|-|
|01110011|01100101|01100011|01110010|01100101|01110100|

A simple way to encrypt the message with the key is to apply the [binary XOR operation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_XOR) on each byte *(repeating the key to be as long as the message)*, meaning :
|H|e|l|l|o| |W|o|r|l|d| |!|
|-|-|-|-|-|-|-|-|-|-|-|-|-|
|01001000|01100101|01101100|01101100|01101111|00100000|01010111|01101111|01110010|01101100|01100100|00100000|00100001|
|s|e|c|r|e|t|s|e|c|r|e|t|s|
|01110011|01100101|01100011|01110010|01100101|01110100|01110011|01100101|01100011|01110010|01100101|01110100|01110011|
|*xor*|*xor*|*xor*|*xor*|*xor*|*xor*|*xor*|*xor*|*xor*|*xor*|*xor*|*xor*|*xor*|
|00111011|00000000|00001111|00011110|00001010|01010100|00100100|00001010|00010001|00011110|00000001|01010100|01010010|
|;|\x0|\xf|\x1e|\xa|T|$|\xa|\x11|\x1e|\x1|T|R|

This gives the encrypted message : `";\x0\xf\x1e\xaT$\xa\x11\x1e\x1TR"`

If we apply the XOR operation again with the exact same key on the encrypted message, we get back the source message.

This simple encoding is not strong enough :
* Since the key is repeated to match the message length, the smaller the key, the weaker it is.
* Furthermore, the closer we get to the key, the more the message will be readable.

In this implementation, several mechanisms are in place to make the password and the encryption stronger :
* The password is concatenated with random bytes (salt)
* The resulting password length is adjusted to make sure it is not a multiple of 64
* Only the necessary salt bytes are saved in the encrypted message
* A [sha512](https://en.wikipedia.org/wiki/SHA-2) hash is built with the final password (length is 64 bytes)
* When encoding / decoding, given the offset of the current byte to process, the mask is built by getting the password byte (offset % passwordLength) and the corresponding hash byte (offset % 64) and doing XOR on the two bytes. Because the password length is not a multiple of 64, it generates a sequence of at least 63 * 64 unique bytes.
