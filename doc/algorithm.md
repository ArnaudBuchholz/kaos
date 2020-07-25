# &#975;&#592;&oplus;&sopf;

This document provides **details** about the algorithm used in Kaos encryption / decryption engine.

## Base algorithm

Let's consider the message `Hello World !`.

If we associate each letter to its ASCII code we get an array of bits :

|H|e|l|l|o| |W|o|r|l|d| |!|
|-|-|-|-|-|-|-|-|-|-|-|-|-|
|01001000|01100101|01101100|01101100|01101111|00100000|01010111|01101111|01110010|01101100|01100100|00100000|00100001|

The same way, the key `secret` can be represented with the following array of bits :

|s|e|c|r|e|t|
|-|-|-|-|-|-|
|01110011|01100101|01100011|01110010|01100101|01110100|

A simple way to **encrypt** the message with the key is to **apply the [binary XOR operation (a.k.a. &oplus;)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_XOR) on each byte** *(repeating the key so that it becomes as long as the message)*, meaning :
|message|H|e|l|l|o| |W|o|r|l|d| |!|
|-|-|-|-|-|-|-|-|-|-|-|-|-|-|
|message bits|01001000|01100101|01101100|01101100|01101111|00100000|01010111|01101111|01110010|01101100|01100100|00100000|00100001|
|key|s|e|c|r|e|t|s|e|c|r|e|t|s|
|key bits|01110011|01100101|01100011|01110010|01100101|01110100|01110011|01100101|01100011|01110010|01100101|01110100|01110011|
|message &oplus; key|00111011|00000000|00001111|00011110|00001010|01010100|00100100|00001010|00010001|00011110|00000001|01010100|01010010|
|encrypted message|;|\x0|\xf|\x1e|\xa|T|$|\xa|\x11|\x1e|\x1|T|R|

This gives the encrypted message : `;\x0\xf\x1e\xaT$\xa\x11\x1e\x1TR`

To **retrieve** the original message, one just has to apply the **XOR operation again** with the exact same key on the encrypted message.

## Advanced algorithm

This basic encoding has significant **weaknesses** :
* Since the key is **repeated** to match the message length, the **smaller** the key, the **weaker** it is.
* Additionnaly, when trying to **break the key**, the **more bytes are found**, the more characters of the original message are **readable**.

Several mechanisms are in place to make the key and the encryption stronger :
* The key is **salted**, meaning it is **concatenated with random bytes**.
* The resulting **key length is adjusted** to make sure it is **not a multiple of 64**. It means that the **salt length depends on the key length**.
* The salt bytes are **saved** at the beginning of the encrypted message.
* A [sha512](https://en.wikipedia.org/wiki/SHA-2) **hash is built from the salted key**, the hash length is 64 bytes.
* When encoding / decoding, given the **offset of the current byte** to process, the **mask** to apply is built by getting the **corresponding salted key byte** (offset % saltedKeyLength) and the **corresponding hash byte** (offset % 64) and applying XOR on the two bytes. Because the password length is not a multiple of 64, it generates a **virtual sequence of unique bytes** that is longer than the salted key.
* If the above mask building gives 0 *(which would means **no alteration** of the message byte)*, the mask is built using **additional binary combinations**.
* The offset is **shifted randomly** *(based on the last 4 bytes of the salt)*

The following table illustrates the mask building based on the salted key and the hash bytes *(each byte represented by one char)*.

|Mask offset|0|1|2|3|4|5|6|7|8|9|10|
|-|-|-|-|-|-|-|-|-|-|-|-|
|salted key|K|e|y|*S*|*a*|*l*|*t*|K|e|y|*S*|
|hash|H|a|s|h|H|a|s|h|H|a|s|
|mask|K&oplus;H|e&oplus;a|y&oplus;s|S&oplus;h|a&oplus;H|l&oplus;a|t&oplus;s|K&oplus;h|e&oplus;H|y&oplus;a|S&oplus;s|

As a result, not only the **key content** but also the **key length** are required to **decrypt the message properly**. Furthermore, thanks to the salt and hash, even if some characters of the key are known, the message remains **unreadable**.
