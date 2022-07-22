//@ts-check
const _ = require('lodash');

const ts = require("typescript")

const fs = require("fs")

function exitLog(text) {
    console.log(text)
    process.exit(-1)
}

const file = process.argv[2]

if (!file) exitLog("I need a file dum dum")

if (!(_.endsWith(file, "cts") || _.endsWith(file, "ts"))) exitLog("How about you give me a typescript file!")

const sourceCode = fs.readFileSync(file, 'utf-8')

if (!sourceCode) exitLog("invalid source code")

let tsSourceFile = ts.createSourceFile(
    __filename,
    sourceCode,
    ts.ScriptTarget.Latest
);

let filename = "err"

try {
    //@ts-ignore
    if (!(['1', '2'].every(key => Object.keys(tsSourceFile.statements[1].members).includes(key)))) return exitLog("Tree invalid")
    //@ts-ignore
    console.log(`Found ${tsSourceFile.statements[1].name.escapedText}`)

    //@ts-ignore
    filename = tsSourceFile.statements[1].name.escapedText

} catch {
    exitLog("Tree invalid")
}

function getStatements(member) {
    let finalSql = ""
    const keys = Object.keys(member.body.statements).slice(0, -4)

    for (const key of keys) {
        const currNode = member.body.statements[key].expression.expression.arguments['0'].rawText
        finalSql += currNode + ";\n"
    }

    return finalSql

}
//@ts-ignore
const up = getStatements(tsSourceFile.statements[1].members['1'])
//@ts-ignore
const down = getStatements(tsSourceFile.statements[1].members['2'])

fs.writeFileSync(`sqlScripts/${filename}_UP.sql`, up)

fs.writeFileSync(`sqlScripts/${filename}_DOWN.sql`, down)

console.log(`Wrote sqlScripts/${filename}_UP.sql and sqlScripts/${filename}_DOWN.sql!`)

