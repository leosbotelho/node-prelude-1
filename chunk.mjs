import { replicate, sum } from "./arr.mjs"

const chunk = n => a =>
  replicate(Math.ceil(a.length / n))(1).map((_, i) =>
    a.slice(i * n, (i + 1) * n)
  )

const chunkSome =
  (...ns) =>
  (...xss) => {
    const argCount = xss.length
    let taken = replicate(argCount)(0)
    const s = sum(ns)
    let ret = []
    let cur
    while (1) {
      cur = []
      for (let i = 0; i < argCount; i++) {
        const xs = xss[i]
        const taken_ = taken[i]
        if (xs.length == taken_) continue
        const slice = xs.slice(taken_, taken_ + ns[i])
        taken[i] += slice.length
        cur.push(...slice)
      }
      if (!cur.length) break
      for (let i = 0; cur.length != s && i < argCount; i++) {
        const xs = xss[i]
        const taken_ = taken[i]
        if (xs.length == taken_) continue
        const slice = xs.slice(taken_, taken_ + (s - cur.length))
        taken[i] += slice.length
        cur.push(...slice)
      }
      if (!cur.length) break
      ret.push(cur)
    }
    return ret
  }

export { chunk, chunkSome }
