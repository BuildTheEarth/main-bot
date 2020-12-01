import fs from "fs/promises"
import path from "path"
import Discord from "discord.js"

export default async function loadDir<T>(
    dir: string,
    process?: (value: T) => T,
    baseCollection?: Discord.Collection<string, T>
): Promise<Discord.Collection<string, T>> {
    const result = baseCollection || new Discord.Collection<string, T>()
    const files = await fs.readdir(dir)
    for (const file of files) {
        const name = file.replace(/.js$/, "")
        const filepath = path.join(dir, file)
        let value: T = (await import(filepath)).default
        if (process) value = process(value)
        result.set(name, value)
    }
    return result
}
