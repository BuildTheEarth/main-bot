//I am dumb
//@ts-check
const JSON5 = require('json5');
const fs = require('fs');

const dumb = fs.readFileSync("./config/extensions/messages/messages_en.json5", "utf8")

const dumber = JSON5.parse(dumb);

let lol = {}

for (const totalidiot of Object.entries(dumber)) {
    /**
     * @type {string[]}
     */
    const hallo = totalidiot[1]
    const ohgod = []
    for (const braindead of Object.entries(hallo)) {
        /**
         * @type {string}
         */
        let replacedStupid = braindead[1]
        const count = replacedStupid.match(/%s/g) || []
        for (let i = 0; i < count.length; i++) {
            replacedStupid = replacedStupid.replace("%s", `%${i + 1}s`)
        }
        ohgod.push(replacedStupid)
    }
    lol[totalidiot[0]] = ohgod
}

fs.writeFileSync("./config/extensions/messages/messages_en_hopefullyfixed.json5", JSON5.stringify(lol, null, 2))