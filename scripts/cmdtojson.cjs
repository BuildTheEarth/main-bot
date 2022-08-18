//@ts-check
const _ = require('lodash');
const util = require('util')
const ts = require("typescript")

const fs = require("fs")

const JSON5 = require('json5')

function exitLog(text) {
    console.log(text)
    process.exit(-1)
}

function ndNested(props) {
    if (!props) return
    const name = props.filter((x) => x.name.escapedText === 'name')[0].initializer.text
    const desc = props.filter((x) => x.name.escapedText === 'description')[0].initializer.text
    const r = {name: name, translated_name: name, description: desc, translated_description: desc}
    return r
}

function nameAndDescAst(props) {
    const r = ndNested(props)
    try {
        const args = Array.from(props.filter((x) => x.name.escapedText === 'args')[0].initializer.elements).map(z => ndNested(z.properties));

        if (args) r['args'] = args
    } catch{}

    try {
        const subcommands = Array.from(props.filter((x) => x.name.escapedText === 'subcommands')[0].initializer.elements).map(z => nameAndDescAst(z.properties));

        if (subcommands) r['subcommands'] = subcommands
    } catch{}



    return r
}


function aliasesAst(props) {
    const a =  Array.from(props.filter((x) => x.name.escapedText === 'aliases')[0].initializer.elements).map(t => t.text)
    return {aliases: a, translated_aliases: a}
}

for (const file of fs.readdirSync("src/commands")) {
    let  obj = {}

    const sourceCode = fs.readFileSync("src/commands/" + file, 'utf-8')

    if (!sourceCode) exitLog("invalid source code")

    const node = ts.createSourceFile("x.ts", sourceCode, ts.ScriptTarget.Latest);

    const nested = node.statements.filter((x) => x.kind === 271)[0].expression.arguments[0].properties


    obj = {...nameAndDescAst(nested), ...aliasesAst(nested), ...obj}

    const json = JSON5.stringify(obj, null, 4)

    const dir = `config/extensions/commands/${file.replace(".command.ts", "")}`

    try {fs.mkdirSync(dir)} catch {}
    
    console.log(dir)

    fs.writeFileSync(dir + `/en.json5`, json)



}
