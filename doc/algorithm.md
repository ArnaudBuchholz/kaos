# &#975;&#592;&oplus;&#5835;

## Base algorithm

Let's consider the message `"Hello World !"`

If we associate each letter to its ASCII code we get a bit array :

|H|e|l|l|o| |W|o|r|l|d| |!|
|-|-|-|-|-|-|-|-|-|-|-|-|-|
|01001000|01100101|01101100|01101100|01101111|00100000|01010111|01101111|01110010|01101100|01100100|00100000|00100001|

The same way, the key `"secret"` can be represented with the following bit array :

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

## Advanced algorithm

This basic encoding is not strong enough :
* Since the key is repeated to match the message length, the smaller the key, the weaker it is.
* Additionnaly, when trying to break the key, the more bytes are found, the more characters of the message is readable.

In the final implementation, several mechanisms are in place to make the key and the encryption stronger :
* The key is _salted_, meaning concatenated with random bytes
* The resulting key length is adjusted to make sure it is not a multiple of 64
* The salt bytes are saved at the beginning of the encrypted message
* A [sha512](https://en.wikipedia.org/wiki/SHA-2) hash is built with the salted key, the hash length is 64 bytes
* When encoding / decoding, given the offset of the current byte to process, the mask to apply is built by getting the corresponding salted key byte (offset % saltedKeyLength) and the corresponding hash byte (offset % 64) and applying XOR on the two bytes. Because the password length is not a multiple of 64, it generates a virtual sequence of unique bytes that is longer than the salted key.
* If the above mask building gives 0 *(which would means no alteration of the message byte)*, the mask is built using additional binary operations
* The offset is shifted randomly *(based on the last 4 bytes of the salt)*

As a result, not only the key content but also the key length is required to decrypt the message properly. Also, thanks to the salt and hash, even if some characters of the key are known, the message remains unreadable.
