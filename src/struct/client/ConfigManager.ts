import path from "path"
import JSON5 from "json5"
import fs from "fs"
import Client from "../Client.js"
import { SuggestionStatus } from "../../entities/Suggestion.entity.js"
import { Action } from "../../entities/ActionLog.entity.js"
import { EmojiIdentifierResolvable } from "discord.js"
import MessagesConfig from "./MessagesConfig.js"
import url from "url"

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
    pointLog: string
}

export type ImagesConfig = {
    bindPort: number
    bindAddress: string
    apiUrl: string
}

export default class ConfigManager {
    client: Client
    prefix!: string
    appeal!: string
    vanity!: string
    isDev!: boolean
    developers!: string[]
    jenkinsEnv!: boolean
    logging!: LoggingConfig
    guilds!: GuildCategories
    suggestions!: GuildCategories & { discussion: GuildCategories }
    suggestionOffset!: GuildCategories<number>
    reactionRoles!: ReactionRole
    images!: ImagesConfig
    emojis!: EmojiList
    colors!: ColorPalette & { suggestions: SuggestionCategories }
    assets!: AssetList
    token!: string
    modpackAuth!: string
    interKey!: string
    apiWhitelist!: string[]
    database!: DatabaseInfo
    submodules: Submodules
    envBindings: Record<string, string>
    suspiciousUsers!: string
    websiteToken!: string
    wmSocket!: string

    constructor(client: Client) {
        this.client = client
        this.submodules = { messages: new MessagesConfig(this.client) }
        //sorry for the hacky stuff here, use self instead of this
        this.envBindings = {
            DB_TYPE: "self.database.type",
            DB_PATH: "self.database.path",
            DB_HOST: "self.database.host",
            DB_NAME: "self.database.name",
            DB_USER: "self.database.user",
            DB_PASS: "self.database.pass",
            TOKEN: "self.token",
            MODPACK_AUTH: "self.modpackAuth",
            INTER_KEY: "self.interKey"
        }
    }

    async load(): Promise<void> {
        const configPath = path.join(
            path.dirname(url.fileURLToPath(import.meta.url)),
            "../../../config/config.json5"
        )
        const config = await fs.promises
            .readFile(configPath, "utf-8")
            .then(json5 => JSON5.parse(json5))
            .catch((e: Error) => {
                this.client.logger.error(
                    `Failed to read config/config.json5: ${e.message}`
                )
                process.exit(1)
            })
        for (const [key, value] of Object.entries(config))
            if ((this as Record<string, unknown>)[key] !== null)
                (this as Record<string, unknown>)[key] = value
        for (const [key, value] of Object.entries(process.env)) {
            if (key in this.envBindings) {
                const replacer = `function(self, v) {${this.envBindings[key]} = v}`
                const wrap = (s: string) => `{ return ${s} };`
                const assigner = new Function(wrap(replacer))
                assigner.call(null).call(null, this, value)
            }
        }
        for (const submodule of Object.values(this.submodules)) await submodule.load()
    }

    unload(): void {
        const excemptKeys = ["submodules", "client", "envBindings"]
        for (const key of Object.keys(this).filter(key => !excemptKeys.includes(key))) {
            delete (this as Record<string, unknown>)[key]
        }
        for (const submodule of Object.values(this.submodules)) submodule.unload()
    }
}
