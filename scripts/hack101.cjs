const fs = require('fs');
const chalk = require("chalk")

const warn = fs.readFileSync('./scripts/block.txt', "utf-8")

console.log(chalk.bold.bgBlue.red(warn))

const file = fs.readFileSync('./node_modules/discord.js/typings/index.d.ts', "utf-8")

const file2 = fs.readFileSync('./node_modules/@discordjs/builders/dist/index.d.ts', "utf-8")

fs.writeFileSync('./node_modules/discord.js/typings/index.d.ts', "//@ts-nocheck\n" + file)
fs.writeFileSync('./node_modules/@discordjs/builders/dist/index.d.ts', "//@ts-nocheck\n" + file2)

console.log()