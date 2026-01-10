import fs from "fs"
import path from "path"
import { Collection } from "discord.js"
import Command from "../struct/Command.js"
import BotClient from "../struct/BotClient.js"
import url from "url"

export default async function loadDir<T>(
    dir: string,
    client: BotClient,
    process?: (value: T) => T | Promise<T>,
    baseCollection?: Collection<string, T>
): Promise<Collection<string, T>> {
    const result = baseCollection || new Collection<string, T>()
    const files = await fs.promises.readdir(url.pathToFileURL(dir))
    for (const file of files) {
        const name = file.replace(/.js|.ts$/, "")
        const filepath = path.join(dir, file)
        let value: T = (await import(url.pathToFileURL(filepath).toString())).default
        if (process) value = await process(value)
        if (!client.config.isDev && value instanceof Command && value.devOnly) continue
        else result.set(name, value)
    }

    return result
}
