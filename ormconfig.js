const fs = require("fs")
const YAML = require("yaml")

const content = fs.readFileSync(__dirname + "/config.yml", "UTF-8")
const config = YAML.parse(content)

module.exports = {
    type: "mysql",
    host: config.database.host,
    database: config.database.name,
    username: config.database.user,
    password: config.database.pass,

    migrations: ["dist/migrations/*.js"],
    cli: { migrationsDir: "src/migrations" }
}
