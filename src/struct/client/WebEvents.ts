import { Client } from "discord.js"
import url from "url"
import pathModule from "path"
import fs from "fs"
import { loadSyncJSON5 } from "@buildtheearth/bot-utils"

export default class WebEvents {
    client: Client

    private objs: Map<string, any>

    constructor(client: Client) {
        this.client = client
        this.objs = new Map()
    }

    public async load(): Promise<void> {
        const dir = pathModule.join(
            pathModule.dirname(url.fileURLToPath(import.meta.url)) +
                "/../../../config/extensions/web/replies"
        )
        const files = await fs.promises.readdir(url.pathToFileURL(dir))
        for (const file of files) {
            this.objs.set(
                file.replace(/.json$/, ""),
                loadSyncJSON5(pathModule.join(dir, file))
            )
        }
    }

    public hasMessage(message: string): boolean {
        return this.objs.has(message)
    }

    public fill(message: string, args: Record<string, any>): any {
        let toRet = JSON.stringify(this.objs.get(message))
        for (const key of Object.keys(args)) {
            toRet = toRet.replace("${" + key + "}", args[key].toString())
        }

        return JSON.parse(toRet)
    }
}
