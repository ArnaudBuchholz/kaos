const crypto = require('crypto')

const message = process.argv[2]
const secret = process.argv[3]

function show (string, skipSeparator = false) {
  if (!Array.isArray(string)) {
    string = string.split('')
  }
  console.log('|' + string.map(char => { const code = char.charCodeAt(0); return code < 32 ? '\\x' + code.toString(16) : char }).join('|') + '|')
  if (!skipSeparator) {
    console.log('|' + string.map(() => '-').join('|') + '|')
  }
  console.log('|' + string.map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join('|') + '|')
}

show(message)

if (secret) {
  console.log()
  show(secret)
  console.log()

  const sha256 = crypto.createHash('sha256')
  sha256.update(secret)
  show(sha256.digest('utf8'))
  console.log()

  const paddedSecret = secret.padEnd(message.length, secret)

  show(message)
  show(paddedSecret, true)

  const encrypted = message
    .split('')
    .map((char, index) => {
      const source = char.charCodeAt(0)
      const mask = paddedSecret.charCodeAt(index)
      const result = source ^ mask
      return String.fromCharCode(result)
    })

  show(encrypted, true)
}