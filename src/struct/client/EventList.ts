import Discord from "discord.js"
import loadDir from "../../util/loadDir.util.js"
import Client from "../Client.js"
import pathModule from "path"
import url from "url"

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
        await loadDir(
            pathModule.dirname(url.fileURLToPath(import.meta.url)) + "/../../events/",
            this.client,
            bind,
            this
        )
    }

    register(): void {
        //@ts-ignore a bunch of errors related to event name and handler typings
        //Here also cause formatter is quite annoying
        this.forEach((handler, name) =>
            //@ts-ignore a bunch of errors related to event name and handler typings
            this.client.on(name.replace(".event", ""), handler)
        )
    }

    unloadOne(name: string): void {
        this.delete(name + ".event")
        const path = require.resolve(
            pathModule.dirname(url.fileURLToPath(import.meta.url)) +
                `/../../events/${name}.event.${globalThis.fileExtension}`
        )
        delete require.cache[path]
    }

    unregisterOne(name: string): void {
        // @ts-ignore: same as above
        this.client.off(name, this.get(name + ".event"))
    }

    async loadOne(name: string): Promise<void> {
        const path =
            pathModule.dirname(url.fileURLToPath(import.meta.url)) +
            `/../../events/${name}.event.${globalThis.fileExtension}`
        const handler: (...args: unknown[]) => unknown = (await import(path)).default
        this.set(name + ".event", handler)
    }

    registerOne(name: string): void {
        // @ts-ignore: same as above
        this.client.on(name, this.get(name + ".event"))
    }
}
