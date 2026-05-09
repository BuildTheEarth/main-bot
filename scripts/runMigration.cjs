const path = require("path")
const mysql = require("mysql2/promise")

const filePath = path.join(__dirname, "../sqlScripts/Snowflake191658519013499_UP.sql")

const fs = require('fs')
const JSON5 = require('json5')

const content = fs.readFileSync(path.join(__dirname,  "../config/config.json5"), {encoding: "utf-8"})
const config = JSON5.parse(content)

async function runMigration() {
    const sql = fs.readFileSync(filePath, { encoding: "utf-8" })
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || config.database.host,
        database: process.env.DB_NAME || config.database.name,
        user: process.env.DB_USER || config.database.user,
        password: process.env.DB_PASS || config.database.pass,
        multipleStatements: true,
    })

    try {
        await connection.query(sql)
        console.log("Script successfully executed!")
    } finally {
        await connection.end()
    }
}

runMigration().catch(err => {
    console.error(err)
    process.exitCode = 1
})
