const fs = require("fs")
const JSON5 = require("json5")

const content = fs.readFileSync(__dirname + "/config/config.json5", "UTF-8")
const config = JSON5.parse(content)

module.exports = {
    type: "mysql",
    host: config.database.host,
    database: config.database.name,
    username: config.database.user,
    password: config.database.pass,

    migrations: ["dist/migrations/*.js"],
    cli: { migrationsDir: "src/migrations" }
}
