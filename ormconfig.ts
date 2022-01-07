import fs from 'fs';
import JSON5 from 'json5';

const content = fs.readFileSync(__dirname + "/config/config.json5", {encoding: "utf-8"})
const config = JSON5.parse(content)

export = {
    type: "mysql",
    host: config.database.host,
    database: config.database.name,
    username: config.database.user,
    password: config.database.pass,

    migrations: ["dist/migrations/*.js"],
    cli: { migrationsDir: "src/migrations" }
}
