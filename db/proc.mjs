import * as E from "./exc.mjs"
import { isStr, Tagged } from "../pre.mjs"
import { DbRetry } from "../ras.mjs"

const Out = (...names) =>
  Tagged("Out")(Object.fromEntries(names.map(name => [name, null])))

const parseCall_ = s => {
  const m = s.match(/call (.*?)(\(.*?\));?\s*$/m)
  if (!m) return false
  return { name: m[1], param: m[2] }
}

const call__ =
  L =>
  async (...arg) => {
    let rss
    let warn = []
    try {
      let res
      let out
      if (arg[0].Name === "Prep") {
        const [prep, vs_] = arg
        let vs = vs_ || []
        if (vs.length && (vs.slice(-1)[0] || {}).Name === "Out") out = vs.pop()
        if (out !== undefined) vs.push(...Object.values(out))
        res = await prep.execute(vs, { L })
      } else {
        const [conn, a, vs_] = arg
        let vs = vs_ || []
        const { multi, ...b } = isStr(a) ? { sql: a } : a
        const c = {
          ...b,
          sql: multi ? b.sql : `call ${b.sql}`
        }
        if (vs.length && (vs.slice(-1)[0] || {}).Name === "Out") out = vs.pop()
        if (out !== undefined) vs.push(...Object.values(out))
        const op = out !== undefined ? "execute" : "query"
        res = await conn[op](c, vs, {
          qryName: parseCall_(c.sql).name,
          isProc: true
        })
      }
      rss = Array.from(res)
        .filter(a => (a.constructor || {}).name !== "OkPacket")
        .map(a => Array.from(a))
        .filter(rs => {
          if (E.isWarn(rs)) {
            warn.push(rs[0][2])
            return false
          }
          return true
        })
      if (out !== undefined) {
        const vs = rss.pop()[0]
        const ks = Object.keys(out)
        for (let i = 0; i < vs.length; i++) out[ks[i]] = vs[i]
      }
    } catch (e) {
      if (!E.isDriverExc(e)) throw e
      let sqlState = []
      let sqlCode = []
      const msg = e.text
      const m = E.sqlMatchStr(msg)
      if (m) {
        ;({ sqlState, sqlCode } = m)
      }
      sqlState.unshift(e.sqlState)
      sqlCode.unshift(e.errno)
      throw E.ProcExc({ ret: 1, sqlState, sqlCode, msg })
    }
    return { ret: 0, rss, warn }
  }

const call_ =
  L =>
  (...arg) =>
    DbRetry.execute(() => call__(L)(...arg))

const call =
  L =>
  async (...arg) => {
    try {
      const a = await call_(L)(...arg)
      await Promise.all(a.warn.map(w => L.nat.san("proc", "warn", w)))
      return a
    } catch (e) {
      if (e.name === "ProcExc") {
        if (E.isUserDef(e.sqlState[0])) await L.nat.san("proc", "exc", e.msg)
      }
      throw e
    }
  }

export { Out, parseCall_, call_, call }
