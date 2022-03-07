import fs from "fs"
import path from "path"
import Discord from "discord.js"
import Command from "../struct/Command.js"
import Client from "../struct/Client.js"
import url from "url"

export default async function loadDir<T>(
    dir: string,
    client: Client,
    process?: (value: T) => T,
    baseCollection?: Discord.Collection<string, T>
): Promise<Discord.Collection<string, T>> {
    const result = baseCollection || new Discord.Collection<string, T>()
    const files = await fs.promises.readdir(url.pathToFileURL(dir))
    for (const file of files) {
        const name = file.replace(/.js|.ts$/, "")
        const filepath = path.join(dir, file)
        let value: T = (await import(url.pathToFileURL(filepath).toString())).default
        if (process) value = process(value)
        if (!client.config.isDev && value instanceof Command && value.devOnly) continue
        else result.set(name, value)
    }

    return result
}
