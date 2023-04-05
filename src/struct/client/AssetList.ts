import Discord from "discord.js"
import Client from "../Client.js"
import pathModule from "path"
import url from "url"
import fs from "fs"
import { loadSyncJSON5 } from "@buildtheearth/bot-utils"

function getFiles(source: fs.PathLike): string[] {
    return fs
        .readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
}

// eslint-disable-next-line @typescript-eslint/ban-types
export default class AssetList {
    client: Client
    collection: Discord.Collection<
        string,
        { [key: string]: any }
    > = new Discord.Collection()
    constructor(client: Client) {
        this.client = client
    }

    async load(): Promise<void> {
        const dir = pathModule.join(
            pathModule.dirname(url.fileURLToPath(import.meta.url)) +
                "/../../../config/extensions/templates/"
        )
        const files = await fs.promises.readdir(
            url.pathToFileURL(dir)
        )
        for (const file of files) {
            const data = loadSyncJSON5(
                pathModule.join(dir, file)
            )
            const trueName = file.replace(/.json5$/, "")

            this.collection.set(trueName, data)
        }
    }

    getAsset(
        name: string
    ): any | undefined {
        return this.collection.get(name)
    }
}
