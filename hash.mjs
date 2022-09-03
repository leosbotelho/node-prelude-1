import { createHash } from "node:crypto"
import { Us, undefToNull } from "./pre.mjs"

const Hs = Us

const NullEscSeq = "\\N"

const md5_digest = s => createHash("md5").update(s).digest()

const md5_u64 = s => md5_digest(s).readBigUInt64BE()

const hash_ = (() => {
  const f = s => {
    s = undefToNull(s)
    if (s === NullEscSeq) s = `\\${NullEscSeq}`
    else if (s === null) s = NullEscSeq
    return s
  }
  return (...ss) => md5_u64(ss.map(f).join(Hs))
})()

export { Hs, NullEscSeq, md5_digest, md5_u64, hash_ }
