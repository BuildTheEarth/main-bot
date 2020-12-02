import path from "path"

// TODO: use YAML
export default class ConfigManager implements Config {
    prefix: string
    ownerIds: string[]
    logChannel: string
    token: string
    db: { host: string; name: string; user: string; pass: string }
    guilds: { main: string; staff: string }

    async load() {
        const config: Config = await import(path.join(__dirname, "../../../config"))
        for (const [key, value] of Object.entries(config)) this[key] = value
    }
}

export type ConfigKey = "prefix" | "ownerIds" | "logChannel" | "token" | "db"

export type Config = {
    prefix: string
    ownerIds: string[]
    logChannel: string
    guilds: {
        main: string
        staff: string
    }

    token: string
    db: {
        host: string
        name: string
        user: string
        pass: string
    }
}
