import Discord from "discord.js"
import Client from "../Client.js"
import pathModule from "path"
import url from "url"
import fs from "fs"
import { loadSyncJSON5 } from "@buildtheearth/bot-utils"

function getDirectories(source: fs.PathLike): string[] {
    return fs
        .readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
}

// eslint-disable-next-line @typescript-eslint/ban-types
export default class ModalList {
    client: Client
    collection: Discord.Collection<
        string,
        { [key: string]: { components: unknown[]; customId: string; title: string } }
    > = new Discord.Collection()
    constructor(client: Client) {
        this.client = client
    }

    async load(): Promise<void> {
        const dir = pathModule.join(
            pathModule.dirname(url.fileURLToPath(import.meta.url)) +
                "/../../../config/extensions/modals/"
        )
        const folders = getDirectories(dir)
        for (const folder of folders) {
            const locales = {}
            const files = await fs.promises.readdir(
                url.pathToFileURL(pathModule.join(dir, folder))
            )
            for (const file of files) {
                locales[file.replace(/.json5$/, "")] = loadSyncJSON5(
                    pathModule.join(dir, folder, file)
                )
            }
            this.collection.set(folder, locales)
        }
    }

    getLocaleModal(
        modal: string,
        locale: string
    ): { components: unknown[]; customId: string; title: string } {
        let trueLocale = "en"
        if (locale === "zh-CN") trueLocale = "zh-s"
        else if (locale === "zh-TW") trueLocale = "zh-t"
        else trueLocale = locale.split("-")[0]
        if (this.collection.get(modal)[trueLocale] !== undefined)
            return this.collection.get(modal)[trueLocale]
        return this.collection.get(modal)["en"]
    }
}
