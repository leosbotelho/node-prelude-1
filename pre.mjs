import { customAlphabet } from "nanoid"

const ord = c => c.charCodeAt(0)
const chr = c => String.fromCharCode(c)

const [Fs, Gs, Rs, Us] = [0x1c, 0x1d, 0x1e, 0x1f].map(chr)

// \n, \t allowed
const controlToCaret_ = s =>
  s.replaceAll(
    /[\cA-\cH\cK-\cZ\x00\x1b\x1c\x1d\x1f]/g,
    m => "^" + chr(ord(m) + 64)
  )

const [intId, bigintId] = [1, 2].map(
  n => () => parseInt(customAlphabet("0123456789", 9 * n)())
)

const isStr = s => typeof s == "string" || s instanceof String

const undefToNull = x => (x !== undefined ? x : null)

const fromNull = d => x => x === null ? d : x

const Tagged = Name => o =>
  Object.defineProperties(o, {
    Name: { value: Name },
    [Symbol.toStringTag]: { value: Name }
  })

export {
  Fs,
  Gs,
  Rs,
  Us,
  ord,
  chr,
  controlToCaret_,
  intId,
  bigintId,
  isStr,
  undefToNull,
  fromNull,
  Tagged
}
