const dateToIso8601Str = o => o.toISOString().slice(0, -1)

const dtmNowStr = p => {
  const ret = dateToIso8601Str(new Date(Date.now()))

  if (p === undefined || p === 3) {
    return ret
  } else if (p === 0) {
    return ret.slice(0, -4)
  }

  return undefined
}

const dtNowStr = () => dtmNowStr(0).slice(0, 10)

const UnixTs = (() => {
  const _1m = 60
  const _1h = 60 * _1m
  const _1d = 24 * _1h

  const toJs = ts => ts * 1000
  const fromJs = ts => Math.trunc(ts / 1000)

  const now = () => fromJs(Date.now())

  const toIso8601Str = ts => dateToIso8601Str(new Date(toJs(ts)))

  const zero = toIso8601Str(0)

  return {
    _1m,
    _1h,
    _1d,
    toJs,
    fromJs,
    now,
    toIso8601Str,
    zero
  }
})()

const toFsCompatible = s => s.replaceAll(/(:|\.)/g, "-")

export { dateToIso8601Str, dtmNowStr, dtNowStr, UnixTs, toFsCompatible }
