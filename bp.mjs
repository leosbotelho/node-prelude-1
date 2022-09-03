import { logName, mkLogger, L_prefix } from "./logger.mjs"
import { logExc, logFailed } from "./exc.mjs"
import { connectTo } from "./db/conn.mjs"
import { basename } from "node:path"
import { isDbExcWrappedBy } from "./db/exc.mjs"

const TmpDirpathAbs = process.env.BB_TmpDirpathAbs

const BB = {}
const BBR = {}

const progName = s => basename(s, ".mjs")

const main = async (arg, main_) => {
  const { ProgName } = arg
  const mkLogger_ = s => mkLogger({ f_: logName(ProgName + s) })
  let L = {}
  try {
    L.nat = await mkLogger_("")
  } catch (e) {
    return
  }
  try {
    L.exc = await mkLogger_("-exc")
  } catch (e) {
    L.nat.close()
    return
  }
  const log = { failed: logFailed(L), exc: logExc(L) }
  let conn = {}
  try {
    let ok = true
    conn = Object.fromEntries(
      await Promise.all(
        Object.entries(arg.db).map(async ([s, a]) => {
          let conn_ = false
          if (ok) {
            try {
              const r = await connectTo(s, { L, ...a })
              conn_ = r.that
              if (r.this) ok = false
            } catch (e) {
              ok = false
            }
          }
          return [s.toLowerCase() + "c", conn_]
        })
      )
    )
    if (ok) {
      try {
        await main_({ ...conn, L, log })
      } catch (mainExc) {
        mainExc = mainExc || {}
        if (!isDbExcWrappedBy(["", "AccumExc"])(mainExc)) {
          await L.exc.san("main", mainExc)
        }
      }
    }
  } finally {
    await Promise.allSettled(
      Object.values(conn)
        .filter(x => !!x)
        .map(x => x.end())
    )
  }
  L.nat.close()
  L.exc.close()
}

const withL = (conn, ss0, L) => {
  const L_ = L_prefix(...ss0)(L)
  const conn_ = !!conn ? conn.with_({ L: L_ }) : null
  const log_ = { failed: logFailed(L_), exc: logExc(L_) }
  return [conn_, log_, L_]
}

export { TmpDirpathAbs, BB, BBR, progName, main, withL }
