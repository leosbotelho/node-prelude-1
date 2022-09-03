import { got } from "got"
import https from "node:https"

const methods = ["GET", "POST", "PUT", "HEAD", "DELETE", "OPTIONS", "TRACE"]

const tlsv13 = got.extend({
  https: {
    minVersion: "TLSv1.3"
  }
})

const httpsReq_ =
  f =>
  (...arg) =>
    f(async () => https.request(...arg))

export { methods, tlsv13, httpsReq_ }
