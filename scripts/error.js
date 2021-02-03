/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs")
const chalk = require("chalk")

const logs = fs.readdirSync(`${__dirname}/../logs`)
const last = logs[logs.length - 1]
const content = fs
    .readFileSync(`${__dirname}/../logs/${last}`, "UTF-8")
    .replace(/\r\n/g, "\n")

// i will forget what this regex does in 3 hours
const error = content.match(/^(\[[\d:]+\]) ERROR: ([^[]+?)\n\[(?!.*ERROR:)/ms)
if (!error) console.log(chalk.redBright("No error found in latest log file."))
else {
    const [, timestamp, full] = error
    const [, kind, message, stack] = full.match(/(.+): (.+)((\s*at.+\n?)+)?/)

    let formatted = chalk`{yellowBright ${timestamp}} {redBright ${kind}}: ${message.trim()}\n`
    if (stack) formatted += chalk.gray(stack.replace(/^\n+/g, ""))

    console.log(formatted.trim())
}
