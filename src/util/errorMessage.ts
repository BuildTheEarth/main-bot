//fuck ts
//this was such a pain in the ass
// eslint-disable-next-line
const errorMessages = require("../../errorMessages.json")

const proxy = new Proxy({}, { get })
export default proxy as { [key: string]: string }
function get(key: unknown, type: string): string {
    const arrayIndex = Math.floor(Math.random() * errorMessages[type].length)
    return errorMessages[type][arrayIndex]
}
