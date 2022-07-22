const path = require("path")

const filePath = path.join(__dirname, "../sqlScripts/Snowflake191658519013499_UP.sql")

const Runner = require("run-my-sql-file");

const fs = require('fs')
const JSON5 = require('json5')

const content = fs.readFileSync(path.join(__dirname,  "../config/config.json5"), {encoding: "utf-8"})
const config = JSON5.parse(content)

Runner.connectionOptions({
    host: process.env.DB_HOST || config.database.host,
    database: process.env.DB_NAME|| config.database.name,
    user: process.env.DB_USER ||config.database.user,
    password: process.env.DB_PASS || config.database.pass,
});

Runner.runFile(filePath, (err)=>{
    if(err){
       console.log(err);
    } else {
       console.log("Script sucessfully executed!");
    }
 })