import BotClient from "../BotClient.js"
import pathModule from "path"
import url from "url"
import fs from "fs"
import { loadSyncJSON5 } from "@buildtheearth/bot-utils"
import { Collection } from "discord.js"

// eslint-disable-next-line @typescript-eslint/ban-types
export default class AssetList {
    client: BotClient
    collection: Collection<string, { [key: string]: any }> =
        new Collection()
    constructor(client: BotClient) {
        this.client = client
    }

    async load(): Promise<void> {
        const dir = pathModule.join(
            pathModule.dirname(url.fileURLToPath(import.meta.url)) +
                "/../../../config/extensions/templates/"
        )
        const files = await fs.promises.readdir(url.pathToFileURL(dir))
        for (const file of files) {
            const data = loadSyncJSON5(pathModule.join(dir, file))
            const trueName = file.replace(/.json5$/, "")

            this.collection.set(trueName, data)
        }
    }

    getAsset(name: string): any | undefined {
        return this.collection.get(name)
    }
}
