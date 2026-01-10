import { Client } from "discord.js"
import BotClient from "../BotClient.js"
import url from "url"
import pathModule from "path"
import fs from "fs"
import { loadSyncJSON5 } from "@buildtheearth/bot-utils"

export default class WebEvents {
    client: BotClient

    private objs: Map<string, any>

    constructor(client: BotClient) {
        this.client = client
        this.objs = new Map()
    }

    public static escape(message: string): string {
        return message.toString().replaceAll("\n", "\\n").replaceAll('"', '\\"')
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
            toRet = toRet.replace("${" + key + "}", WebEvents.escape(args[key]))
        }

        return JSON.parse(toRet)
    }
}
