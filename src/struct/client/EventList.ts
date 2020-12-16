import Discord from "discord.js"
import loadDir from "../../util/loadDir"
import Client from "../Client"

// eslint-disable-next-line @typescript-eslint/ban-types
export default class EventList extends Discord.Collection<string, Function> {
    client: Client
    constructor(client: Client) {
        super()
        this.client = client
    }

    async load(): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/ban-types
        const bind = (func: Function): Function => func.bind(this.client)
        await loadDir(__dirname + "/../../events/", bind, this)
    }

    register(): void {
        // @ts-ignore: a bunch of errors related to event name and handler typings
        this.forEach((handler, name) => this.client.on(name, handler))
    }

    unloadOne(name: string): void {
        this.delete(name)
        const path = require.resolve(__dirname + `/../../events/${name}.js`)
        delete require.cache[path]
    }

    unregisterOne(name: string): void {
        // @ts-ignore: same as above
        this.client.off(name, this.get(name))
    }

    async loadOne(name: string): Promise<void> {
        const path = __dirname + `/../../events/${name}.js`
        const handler: (...args: unknown[]) => unknown = (await import(path)).default
        this.set(name, handler)
    }

    registerOne(name: string): void {
        // @ts-ignore: same as above
        this.client.on(name, this.get(name))
    }
}
