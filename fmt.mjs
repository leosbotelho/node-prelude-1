import { isStr } from "./pre.mjs"
import { format } from "node:util"

const toStr = s => (isStr(s) ? s : format("%s", s))

const jr = (n, s1, s2) =>
  Array(n)
    .fill(s1)
    .join(s2 !== undefined ? s2 : "")

const bpp = n => jr(n, "?", ", ")

const values = (n1, n2) => jr(n1, `(${bpp(n2)})`, ",\n")

export { toStr, jr, bpp, values }
