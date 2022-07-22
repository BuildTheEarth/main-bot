const fs = require('fs')
const JSON5 = require('json5')

const content = fs.readFileSync(__dirname + "/config/config.json5", {encoding: "utf-8"})
const config = JSON5.parse(content)

if (config.database.type == "mysql" || config.database.type == "mariadb") module.exports = {
    type: "mysql",
    host: config.database.host,
    database: config.database.name,
    username: config.database.user,
    password: config.database.pass,

    migrations: ["dist/migrations/*.{js,ts}"],
    cli: { 
        migrationsDir: "src/migrations",
        entitiesDir: "src/entities",
    }
}

const sqlite =  {
    database: config.database.path,
    type: "better-sqlite3",

    migrations: ["dist/migrations/*.{js,ts}"],
    entities: ["src/entities/*.entity.{js,ts}"],
    cli: { 
        migrationsDir: "src/migrations",
        entitiesDir: "src/entities",
    }
}

if (config.database.type == "sqlite") module.exports = sqlite
