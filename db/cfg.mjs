const BB_Id = 1
const BBR_Id = 2

const P_Db = { BB: BB_Id, BBR: BBR_Id }
const P_Db_entries = Object.entries(P_Db)

const opt0 = db => ({
  user: process.env[`${db}_DbUserName`],
  password: process.env[`${db}_DbPwd`],
  socketPath: process.env["BB_DbSocketPath"]
})

const opt1 = {
  charset: "latin1",
  connectTimeout: 700,
  queryTimeout: 1000,
  rowsAsArray: true,
  multipleStatements: true,
  dateStrings: true
}

const Conn = Object.fromEntries(
  ["BB", "BBR"].map(name => [
    name,
    {
      database: name,
      ...opt0(name),
      ...opt1
    }
  ])
)

export { BB_Id, BBR_Id, P_Db, P_Db_entries, Conn }
