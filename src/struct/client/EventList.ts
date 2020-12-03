import Discord from "discord.js"
import loadDir from "../../util/loadDir"
import Client from "../Client"

export default class EventList extends Discord.Collection<string, Function> {
    client: Client
    constructor(client: Client) {
        super()
        this.client = client
    }

    async load() {
        const bind = (func: Function): Function => func.bind(this.client)
        await loadDir<Function>(__dirname + "/../../events/", bind, this)
    }

    register() {
        // @ts-ignore: a bunch of errors related to event name and handler typings
        this.forEach((handler, name) => this.client.on(name, handler))
    }

    unloadOne(name: string) {
        this.delete(name)
        const path = require.resolve(__dirname + `/../../events/${name}.js`)
        delete require.cache[path]
    }

    unregisterOne(name: string) {
        // @ts-ignore: same as above
        this.client.off(name, this.get(name))
    }

    async loadOne(name: string) {
        const path = __dirname + `/../../events/${name}.js`
        const command: Function = (await import(path)).default
        this.set(command.name, command)
    }

    registerOne(name: string) {
        // @ts-ignore: same as above
        this.client.on(name, this.get(name))
    }
}
