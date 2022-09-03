import { Us } from "../pre.mjs"
import { Exc, isExcWrappedBy } from "../exc.mjs"
import { SqlError as mariadb_SqlError } from "mariadb/lib/misc/errors.js"

const DmlSemSqlCode = [
  1062, // Duplicate
  1169, //

  // FK
  1217, // Parent
  1451, // Parent
  1834, // Parent
  1216, // Child
  1452, // Child

  4025, // Constraint

  1265, // Truncated
  1406 // Too long
]

const isDmlSemSqlCode = c0 => DmlSemSqlCode.some(c => c === c0)

const DbExcName = ["BatchExc", "ProcExc", "DbConnDroppedExc"]

const SqlUnqualSuccess = { sqlState: "00000", sqlCode: 0 }

const ProcExc = a => Exc({ name: "ProcExc", ...a })

const is45_ = o => s => s.startsWith("45" + o)

const isDriver = is45_("0")

const isUserDef = is45_("1")

const [isUserDefE, isUserDefNr, isUserDefNrs] = (() => {
  const p = (a, b) => (st, c) => isUserDef(st) && c >= a && c <= b

  return [11000, 12000, [11000, 12999]].map((x, i) =>
    p(...(i == 2 ? x : [x, x + 999]))
  )
})()

const sqlMatchStr = s => {
  const h = s => s.split(", ")
  const m = s.match(/\(sqlstate: (.*?); sqlcode: (.*?)\)/)
  if (!m || m[0] == "()") return false
  return {
    sqlState: h(m[1]),
    sqlCode: h(m[2]).map(x => parseInt(x))
  }
}

const isWarn = rs =>
  rs.length == 1 && rs[0].length == 3 && rs[0][0] === "Warn" && rs[0][1] === Us

const isDriverExc = e => e instanceof mariadb_SqlError

const isDbExc = e => isDriverExc(e) || DbExcName.some(s => e.name === s)

const isDbExcWrappedBy = isExcWrappedBy(isDbExc)

export {
  DmlSemSqlCode,
  isDmlSemSqlCode,
  DbExcName,
  SqlUnqualSuccess,
  ProcExc,
  is45_,
  isDriver,
  isUserDef,
  isUserDefE,
  isUserDefNr,
  isUserDefNrs,
  sqlMatchStr,
  isWarn,
  isDriverExc,
  isDbExc,
  isDbExcWrappedBy
}
