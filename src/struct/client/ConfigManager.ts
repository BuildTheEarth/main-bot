import path from "path"
import YAML from "yaml"
import fs from "fs"
import Client from "../Client"
import { SuggestionStatus } from "../../entities/Suggestion"
import { Action } from "../../entities/ActionLog"

export type GuildCategories = { main: string; staff: string }
export type SuggestionCategories = Record<SuggestionStatus, string>
export type ActionLogCategories = Record<Action, string>
export type ReactionRoles = { [key: string]: { [key: string]: string } }
export type ColorPalette = { success: string; error: string }
export type DatabaseInfo = { host: string; name: string; user: string; pass: string }

export default class ConfigManager implements Config {
    client: Client
    token: string
    modpack: string
    prefix: string
    logs: string
    appeal: string
    guilds: GuildCategories
    suggestions: GuildCategories
    reactionRoles: ReactionRoles
    colors: ColorPalette & { suggestions: SuggestionCategories }
    assets: { suggestions: SuggestionCategories }
    database: DatabaseInfo

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

    unload() {
        for (const key of Object.keys(this)) {
            if (key !== "client") {
                delete this[key]
            }
        }
    }
}

export type Config = {
    token: string
    modpack: string
    prefix: string
    logs: string
    appeal: string
    guilds: GuildCategories
    suggestions: GuildCategories
    reactionRoles: ReactionRoles
    colors: ColorPalette & { suggestions: SuggestionCategories }
    assets: { suggestions: SuggestionCategories }
    database: DatabaseInfo
}
