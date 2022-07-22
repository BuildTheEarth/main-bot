const mysqldump = require('mysqldump')

//@ts-check

const exec = require('child_process').exec;

const fs = require('fs')
const JSON5 = require('json5')
const path = require('path')

const content = fs.readFileSync(path.join(__dirname,  "../config/config.json5"), {encoding: "utf-8"})
const config = JSON5.parse(content)

let opts = {}

async function main() {

    if (config.database.type == "mysql" || config.database.type == "mariadb"){
        opts = {
            host: process.env.DB_HOST || config.database.host,
            database: process.env.DB_NAME|| config.database.name,
            user: process.env.DB_USER ||config.database.user,
            password: process.env.DB_PASS || config.database.pass,
        }

        const fileName = "sqlBackups/" + new Date(Date.now()).getTime() + ".sql"

        await mysqldump({connection: opts, dumpToFile: fileName, compressFile: false})

        exec(`cat ${fileName} | curl -F 'sprunge=<-' http://sprunge.us`, function (error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            }
        })
    } 
}

main()
