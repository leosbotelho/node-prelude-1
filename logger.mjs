import { dtmNowStr, toFsCompatible } from "./time.mjs"
import { Rs, Us, controlToCaret_, isStr } from "./pre.mjs"
import { toStr } from "./fmt.mjs"
import { nop } from "./mat.mjs"
import { open } from "node:fs/promises"
import clone from "just-clone"

const LogDirpathAbs = process.env.BB_LogDirpathAbs

const logName = s => `${s}-${toFsCompatible(dtmNowStr(0))}`

const san_ =
  raw =>
  (...ss) =>
    raw(...ss.map(s => controlToCaret_(toStr(s))))

const mkLogger_ = ({ id, fh, rs, us, fsync }) => {
  if (rs === undefined) rs = Rs + "\n"
  if (us === undefined) us = Us

  const id_ = id ? `${id}${us}` : ""

  const raw = async (...ss) => {
    try {
      await fh.write(`${id_}${dtmNowStr()}${us}${ss.map(toStr).join(us)}${rs}`)
    } catch (e) {}
    if (fsync && Object.hasOwn(fh, "sync")) {
      try {
        await fh.sync()
      } catch (e) {}
    }
  }

  const san = san_(raw)

  const close = async () => {
    if (![process.stdout, process.stderr].some(x => x === fh)) {
      try {
        await fh.close()
      } catch (e) {}
    }
  }

  return { raw, san, close }
}

const mkLogger = async ({ id, f_, rs, us, fsync }) => {
  let fh
  if (isStr(f_)) {
    if (f_.length && f_[0] != "/") f_ = `${LogDirpathAbs}/${f_}`
    fh = await open(f_, "a", "440")
  } else {
    fh = f_
  }
  return mkLogger_({ id, fh, rs, us, fsync })
}

const DummyLogger = { raw: nop, san: nop, close: nop }

const L_prefix =
  (...ss0) =>
  L => {
    const h =
      (X, k) =>
      (...ss) =>
        X[k](...ss0, ...ss)
    const L_ = clone(L)
    L_.nat.raw = h(L.nat, "raw")
    L_.exc.raw = h(L.exc, "raw")
    L_.nat.san = h(L.nat, "san")
    L_.exc.san = h(L.exc, "san")
    return L_
  }

export {
  LogDirpathAbs,
  logName,
  mkLogger_,
  mkLogger,
  DummyLogger,
  L_prefix
}
