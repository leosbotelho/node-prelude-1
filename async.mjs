import { Exc } from "./exc.mjs"

const AccumExc = a => Exc({ name: "AccumExc", ...a })

async function* accum(n, th) {
  let bs = []
  try {
    for await (let b of th()) {
      bs.push(b)
      if (bs.length % n == 0) {
        yield bs
        bs = []
      }
    }
    if (bs.length) yield bs
  } catch (cause) {
    throw AccumExc({ cause, bs })
  }
}

const accumAll = async th => {
  for await (const bs of accum(Infinity, th)) return bs
  return []
}

export { accum, accumAll }
