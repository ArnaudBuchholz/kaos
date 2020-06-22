# kaos

A simple but efficient stream encrypter

## Constraints

* Streamable
* May start from almost any byte
* Two consecutive encoding with the same key generates different encrypted results

## Rational

Let's assume the message "Hello World !"

If we associate each letter to its ASCII code we have (in bits) :

|H|e|l|l|o| |W|o|r|l|d| |!|
|-|-|-|-|-|-|-|-|-|-|-|-|-|
|01001000|01100101|01101100|01101100|01101111|00100000|01010111|01101111|01110010|01101100|01100100|00100000|00100001
