import { writeFile, unlink } from "node:fs/promises"
import Papa from "papaparse"
import { Rs, Us, controlToCaret_, bigintId, isStr } from "../pre.mjs"
import { NullEscSeq } from "../hash.mjs"
import { Buffer } from "node:buffer"

const BcpTmpDirpathAbs = process.env.BB_BcpTmpDirpathAbs

const PapaUnparseCfg = {
  quotes: false,
  delimiter: Us,
  header: false,
  newline: Rs,
  skipEmptyLines: false
}

const LoadDataQry =
  (Tbl, Col) =>
  ({ remote, charset = "utf8" } = {}) => {
    let charset_ = charset
    if (charset_ === "utf8") charset_ = "utf8mb4"
    const local_ = remote ? "local " : ""
    return `
  load data
    ${local_}infile ?
    into table ${Tbl}
    character set ${charset_}
    fields
      terminated by '\\${Us}'
      enclosed by ''
    lines
      terminated by '\\${Rs}'
    ${Col}
  `
  }

const norm = x => {
  if (x === null) return NullEscSeq
  if (Buffer.isBuffer(x)) return x.toString("base64")
  if (isStr(x)) return controlToCaret_(x)
  return x
}

const bcp_ =
  (Tbl, Col) =>
  ({ remote, encoding, charset = "utf8" } = {}) =>
  async (conn, rows, f) => {
    const filepath = `${BcpTmpDirpathAbs}/${bigintId()}`
    if (encoding === undefined) encoding = charset
    const qry = LoadDataQry(Tbl, Col)({ remote, charset })
    await writeFile(
      filepath,
      Papa.unparse(
        rows.map(row => f(row).map(norm)),
        PapaUnparseCfg
      ),
      { encoding }
    )
    let affectedRows = -1
    let qryExc
    try {
      ;({ affectedRows } = await conn.query(qry, [filepath]))
    } catch (e) {
      qryExc = e
    }
    try {
      await unlink(filepath)
    } catch (e) {}
    if (affectedRows === -1) throw qryExc
    return affectedRows
  }

const bcp =
  (Tbl, Col) =>
  (logFailed_, opt) =>
  (...arg) =>
    logFailed_("bcp", Tbl)(() => bcp_(Tbl, Col)(opt)(...arg), { logExc: false })

export {
  BcpTmpDirpathAbs,
  PapaUnparseCfg,
  LoadDataQry,
  norm,
  bcp_,
  bcp
}
