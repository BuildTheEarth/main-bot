import path from "path"
import JSON5 from "json5"
import fs from "fs"
import Client from "../Client"
import { SuggestionStatus } from "../../entities/Suggestion"
import { Action } from "../../entities/ActionLog"
import { EmojiIdentifierResolvable } from "discord.js"
import MessagesConfig from "./MessagesConfig"

type ConfigSubmoduleTypes = MessagesConfig

export type Submodules = Record<string, ConfigSubmoduleTypes>
export type Field<T = string> = { [key: string]: T }
export type GuildCategories<T = string> = { main: T; staff: T }
export type SuggestionCategories = Record<SuggestionStatus, string>
export type ActionLogCategories = Record<Action, string>
export type ReactionRole = Field<Field<Field>>
export type EmojiList = Field<EmojiIdentifierResolvable> & { text: Field }
export type AssetList = { suggestions: SuggestionCategories; cases: ActionLogCategories }
export type ColorPalette = { success: string; error: string; info: string }
export type DatabaseInfo = {
    type: "mariadb" | "mysql" | "sqlite"
    path?: string
    host?: string
    name?: string
    user?: string
    pass?: string
}
export type LoggingConfig = {
    modLogs: string
    snippetLogs: string
}

export type ImagesConfig = {
    bindPort: number
    bindAddress: string
}

export default class ConfigManager {
    client: Client
    prefix: string
    appeal: string
    vanity: string
    isDev: boolean
    jenkinsEnv: boolean
    logging: LoggingConfig
    guilds: GuildCategories
    suggestions: GuildCategories & { discussion: GuildCategories }
    suggestionOffset: GuildCategories<number>
    reactionRoles: ReactionRole
    images: ImagesConfig
    emojis: EmojiList
    colors: ColorPalette & { suggestions: SuggestionCategories }
    assets: AssetList
    token: string
    modpackAuth: string
    database: DatabaseInfo
    submodules: Submodules

    constructor(client: Client) {
        this.client = client
        this.submodules = { messages: new MessagesConfig(this.client) }
    }

    async load(): Promise<void> {
        const configPath = path.join(__dirname, "../../../config/config.json5")
        const config = await fs.promises
            .readFile(configPath, "utf-8")
            .then(json5 => JSON5.parse(json5))
            .catch((e: Error) => {
                this.client.logger.error(
                    `Failed to read config/config.json5: ${e.message}`
                )
                process.exit(1)
            })

        for (const [key, value] of Object.entries(config)) this[key] = value
        for (const submodule of Object.values(this.submodules)) await submodule.load()
    }

    unload(): void {
        const excemptKeys = ["submodules", "client"]
        for (const key of Object.keys(this).filter(key => !excemptKeys.includes(key))) {
            delete this[key]
        }
        for (const submodule of Object.values(this.submodules)) submodule.unload()
    }
}
