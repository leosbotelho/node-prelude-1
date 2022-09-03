import { toStr } from "./fmt.mjs"

const Exc = ({ name, msg, ...a }) => {
  const exc = Error(toStr(msg || ""))
  exc.name = name
  for (const [k, v] of Object.entries(a)) exc[k] = v
  return exc
}

const isExcWrappedBy = p => ws => e =>
  ws.some(w => (!w && p(e)) || (e.name === w && p(e.cause)))

const logExc =
  L =>
  (...ss) => {
    let async_ = async (th, { rethrow = true, logExc = true } = {}) => {
      try {
        return await th()
      } catch (e) {
        if (ss.length) await L.nat.san(...ss)
        if (logExc) await L.exc.san(e)
        if (rethrow) throw e
      }
    }
    async_.asyncGen = async function* (
      th,
      { rethrow = true, logExc = true } = {}
    ) {
      try {
        yield* th()
      } catch (e) {
        if (ss.length) await L.nat.san(...ss)
        if (logExc) await L.exc.san(e)
        if (rethrow) throw e
      }
    }
    return async_
  }

const logFailed =
  L =>
  (...ss) =>
    logExc(L)(...[...ss, "failed"])

export { Exc, logExc, logFailed, isExcWrappedBy }
