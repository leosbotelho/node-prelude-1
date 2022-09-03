const isArr = x => Array.isArray(x)

const toArr = x => (isArr(x) ? x : [x])

const replicate = n => a => {
  let ret = Array(n).fill(a)
  if (typeof a == "function") return ret.map(th => th())
  return ret
}

const revIf = b => xs => b ? xs.slice().reverse() : xs

const sum = xs => xs.reduce((acc, x) => (acc += x), 0)

const isEmptyObj = o => {
  for (const _ in o) return false
  return true
}

export { isArr, toArr, replicate, revIf, sum, isEmptyObj }
