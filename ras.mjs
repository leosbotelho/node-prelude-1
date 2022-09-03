import * as R from "cockatiel"
import pThrottle from "p-throttle"
import { methods } from "./got.mjs"
import {
  isDmlSemSqlCode,
  isUserDefNrs,
  isDriverExc,
  isDbExc
} from "./db/exc.mjs"

const Q = ({ concurrency, capacity, intervalCap, interval }) => {
  const o = R.bulkhead(concurrency, capacity || Infinity)
  const limit = th => o.execute(th)
  const throttle = pThrottle({
    limit: intervalCap,
    interval
  })
  return {
    add: th => throttle(() => limit(th))()
  }
}

const DbRetry_handleWhen = R.handleWhen(e => {
  e = e || {}
  const p = (st, c) => isUserDefNrs(st, c) || isDmlSemSqlCode(c)
  if (!isDbExc(e)) return false
  if (isDriverExc(e)) {
    return !p(e.sqlState, e.errno)
  } else if (e.name === "ProcExc") {
    return !e.sqlCode.some((c, i) => p(e.sqlState[i], c))
  }
  return false
})

const DbRetry = R.retry(DbRetry_handleWhen, {
  maxAttempts: 3,
  backoff: new R.ExponentialBackoff()
}).dangerouslyUnref()

// https://community.infura.io/t/rate-limit-details/4173/5
const InfuraIntvCap = { Free: 500, Dev: 5000 }

const InfuraQ = Q({
  // https://community.infura.io/t/how-many-max-concurrent-websocket-connections/2699/4
  concurrency: 1000,
  intervalCap: InfuraIntvCap.Free,
  interval: 60 * 1000
})

const InfuraRetry = R.retry(R.handleAll, {
  maxAttempts: 3,
  backoff: new R.ExponentialBackoff({ initialDelay: 256 })
}).dangerouslyUnref()

const InfuraRetryFast = R.retry(R.handleAll, {
  maxAttempts: 3,
  backoff: new R.ConstantBackoff(0)
}).dangerouslyUnref()

const InfuraFastCircuitBreaker = R.circuitBreaker(R.handleAll, {
  breaker: new R.SamplingBreaker({
    threshold: 0.2,
    duration: 1000,
    minimumRps: 100
  })
})

const [infuraw, infurawFast] = [
  InfuraRetry,
  R.wrap(InfuraRetryFast, InfuraFastCircuitBreaker)
].map(o => th => o.execute(() => InfuraQ.add(th)))

// https://www.coingecko.com/en/api/pricing
const CgQ = Q({
  concurrency: 10,
  intervalCap: 10,
  interval: 60 * 1000
})

const got = Object.fromEntries(
  ["Tg", "Cg"].map(k => [
    k,
    {
      retry: {
        methods,
        limit: 3,
        calculateDelay: ({ attemptCount, computedValue }) => {
          if (computedValue == 0) return 0
          if (attemptCount == 3) return 2
          return 1
        }
      }
    }
  ])
)

export {
  Q,
  DbRetry_handleWhen,
  DbRetry,
  InfuraIntvCap,
  InfuraQ,
  InfuraRetry,
  InfuraRetryFast,
  InfuraFastCircuitBreaker,
  infuraw,
  infurawFast,
  CgQ,
  got
}
