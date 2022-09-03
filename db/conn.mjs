import mariadb from "mariadb"
import { Conn as ConnCfg } from "./cfg.mjs"
import { parseCall_, call as proc_call } from "./proc.mjs"
import { isStr, Tagged } from "../pre.mjs"
import { nop, popTh } from "../mat.mjs"
import { Exc, logFailed } from "../exc.mjs"
import { L_prefix } from "../logger.mjs"
import { DbRetry } from "../ras.mjs"

const MaxReconn = 2

// MaxReconnAtOnce = 1, delay = 0
// MaxReprepAtOnce = 1, delay = 0

const retry = th => DbRetry.execute(th)

let ConnReg = {}

const Prep = ({ logFailed_, refreshConn_, a, qryName, isProc }, prep) => {
  let reprep = false
  const retry_ = isProc ? popTh : retry

  const execute = (vs, { L } = {}) => {
    const k = {}
    const f = L === undefined ? logFailed_ : logFailed(L)
    return retry_(() =>
      refreshConn_(
        k,
        () => f("prep", "exec", qryName)(() => prep.execute(vs)),
        newConn =>
          logFailed_(
            "reprep",
            qryName
          )(async () => {
            if (!reprep) {
              reprep = (async () => {
                prep = await newConn.prepare(a)
              })()
            }
            await reprep
            reprep = false
          })
      )
    )
  }

  const close = () => prep.close()

  return Tagged("Prep")({ execute, close, qryName })
}

const Conn = (name, arg0) => {
  let o
  const conn = () => ConnReg[name].conn
  const refreshConn_ = refreshConn(name, arg0)
  const [call_, logFailed__] = [proc_call, logFailed].map(f => f(arg0.L))
  const logFailed_ = (...ss) =>
    logFailed__(...(ss.length && !ss.slice(-1)[0] ? ss.slice(0, -1) : ss))

  const prepare = async (a, { qryName, isProc } = {}) => {
    const k = {}
    return Prep(
      { logFailed_, refreshConn_, a, qryName, isProc },
      await retry(() =>
        logFailed_(
          "prep",
          qryName
        )(() => refreshConn_(k, () => conn().prepare(a)))
      )
    )
  }

  const [query, execute] = (() => {
    const f =
      op =>
      async (a, ...arg) => {
        let qryName
        let isProc
        if (arg.length == 2 || (arg.length == 1 && !Array.isArray(arg[0]))) {
          ;({ qryName, isProc } = arg.pop())
        }
        const retry_ = isProc ? popTh : retry
        const k = {}
        return retry_(() =>
          logFailed_(
            "qry",
            qryName
          )(() => refreshConn_(k, () => conn()[op](a, ...arg)))
        )
      }

    return [f("query"), f("execute")]
  })()

  const prepareProc = a => {
    const { multi, ...b } = isStr(a) ? { sql: a } : a
    const c = {
      ...b,
      sql: multi ? b.sql : `call ${b.sql}`
    }
    return prepare(c, { qryName: parseCall_(c.sql).name, isProc: true })
  }

  const call = (...arg) =>
    call_(...(arg[0].Name !== "Prep" ? [o, ...arg] : arg))

  const refreshOrThrow = () => refreshConn_({}, nop)

  const end = () =>
    logFailed_(
      "conn",
      "end"
    )(async () => {
      const conn_ = conn()
      await conn_.end()
      delete ConnReg[name]
    })

  const with_ = ({ L }) => Conn(name, { ...arg0, L })

  return (o = {
    prepare,
    query,
    execute,
    prepareProc,
    call,
    refreshOrThrow,
    end,
    with_
  })
}

const refreshConn_1atOnce = new WeakMap()

const refreshConn = (name, arg) => async (k, th, f) => {
  const ConnReg_ = ConnReg[name]
  const conn = () => ConnReg_.conn
  if (!refreshConn_1atOnce.has(k) && !conn().isValid()) {
    refreshConn_1atOnce.set(k, true)
    if (!Object.hasOwn(ConnReg_, "reconn"))
      ConnReg_.reconn = reconnectTo(name, arg)
    await ConnReg_.reconn
    delete ConnReg_.reconn
    if (!conn().isValid()) {
      await ConnReg_.arg.L.nat.san("conn", "dropped")
      throw Exc({ name: "DbConnDroppedExc", msg: `db ${name} conn dropped` })
    }
    if (f !== undefined) await f(conn())
  }
  return th()
}

const reconnectTo = async (name, arg) => {
  let ConnReg_ = ConnReg[name]
  if (!Object.hasOwn(ConnReg_, "reconnCount")) ConnReg_.reconnCount = 0
  if (ConnReg_.reconnCount < MaxReconn) {
    ConnReg_.reconnCount++
    await arg.L.nat.san("reconn", ConnReg_.reconnCount)
    try {
      await connectTo(name, arg)
    } catch (e) {}
  }
}

const connectTo = async (name, arg) => {
  const L = L_prefix("db", name)(arg.L)
  const L1 = L_prefix("conn")(L)
  const logFailed_ = logFailed(L1)
  arg = { ...arg, L }
  let { charset } = arg
  if (charset === "utf8") charset = "utf8mb4"
  const charset_ = charset !== undefined ? { charset } : {}
  const conn = await logFailed_()(() =>
    mariadb.createConnection({ ...ConnCfg[name], ...charset_ })
  )
  conn.on("error", async e => {
    await L1.nat.san("err")
    await L1.exc.san(e)
  })
  await L1.nat.san("threadId", conn.threadId)
  ConnReg[name] = { conn }
  let ret = { that: Conn(name, arg) }
  if (Object.hasOwn(arg, "initCmd")) {
    try {
      await ret.that.query(arg.initCmd, { qryName: "initCmd" })
    } catch (e) {
      ret.this = { initCmd: e }
    }
  }
  return ret
}

export { connectTo }
