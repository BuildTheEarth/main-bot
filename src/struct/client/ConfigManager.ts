import path from "path"
import YAML from "yaml"
import fs from "fs"
import Client from "../Client"

export default class ConfigManager implements Config {
    client: Client
    prefix: string
    logChannel: string
    token: string
    db: { host: string; name: string; user: string; pass: string }
    guilds: { main: string; staff: string }
    colors: { success: string; error: string }

    constructor(client: Client) {
        this.client = client
    }

    async load() {
        const configPath = path.join(__dirname, "../../../config.yml")
        const config: Config = await fs.promises
            .readFile(configPath, "utf-8")
            .then(yaml => YAML.parse(yaml))
            .catch((e: Error) => {
                this.client.logger.error(`Failed to read config.yml: ${e.message}`)
                process.exit(1)
            })

        for (const [key, value] of Object.entries(config)) this[key] = value
    }
}

export type Config = {
    prefix: string
    logChannel: string
    guilds: {
        main: string
        staff: string
    }
    colors: {
        success: string
        error: string
    }

    token: string
    db: {
        host: string
        name: string
        user: string
        pass: string
    }
}
