import { Exc } from "../exc.mjs"
import { bigintId } from "../pre.mjs"
import { isArr, sum } from "../arr.mjs"
import { bpp, values } from "../fmt.mjs"
import { dtmNowStr } from "../time.mjs"

const BatchExc = a => Exc({ name: "BatchExc", ...a })

const batch_ = (procName, param) => (conn, p0, chunks) =>
  async function* () {
    const paramName = param.map(a => a[0])
    const paramArgCount = param.map(a => a[1])
    const col_ = param.map(a => (a.length === 3 ? ` ${a[2]}` : ""))
    const call = `call ${procName}_btr(${bpp(p0.length + 1)});`
    const st = {
      affectedChunks: 0,
      remainingChunks: chunks.length,
      affected: 0,
      remaining: sum(chunks.map(chunk => chunk.length))
    }
    if (st.remaining === 0) return
    while (st.remainingChunks > 0) {
      const chunk = chunks[st.affectedChunks]
      let p = []
      // prettier-ignore
      const pushChunk = !isArr(chunk[0])    ? (x => p.push(x))               :
                        !isArr(chunk[0][0]) ? (xs => p.push(...xs))          :
                                              ((xs, i) => p.push(...xs[i]))
      const insertParam = paramName.map(
        (s, i) =>
          `insert into Param ($Id, Dtm, ProcName, ParamName)
values (?, ?, ?, ?);

insert into ${s}${col_[i]}
values
${values(chunk.length, paramArgCount[i] + 1)}
;
`
      )
      const sql = insertParam.join("\n") + "\n" + call
      const paramId = bigintId()
      const paramDtm = dtmNowStr()
      for (let i = 0; i < paramName.length; i++) {
        p.push(paramId, paramDtm, procName, paramName[i])
        for (let j = 0; j < chunk.length; j++) {
          p.push(paramId)
          pushChunk(chunk[j], i)
        }
      }
      p.push(...p0, paramId)
      try {
        yield conn.call({ sql, multi: true }, p)
      } catch (cause) {
        throw BatchExc({ ...st, cause })
      }
      st.affected += chunk.length
      st.remaining -= chunk.length
      st.affectedChunks++
      st.remainingChunks--
    }
  }

const batch =
  (procName, n) =>
  logFailed_ =>
  (...arg) =>
    logFailed_("batch", procName).asyncGen(batch_(procName, n)(...arg), {
      logExc: false
    })

export { batch_, batch }
