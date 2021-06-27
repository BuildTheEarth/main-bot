import path from "path"
import YAML from "yaml"
import fs from "fs"
import Client from "../Client"
import { SuggestionStatus } from "../../entities/Suggestion"
import { Action } from "../../entities/ActionLog"
import { EmojiIdentifierResolvable } from "discord.js"

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
export type loggingConfig = {
    modLogs: string
    snippetLogs: string
}
export type GoogleDriveKeyInfo = {
    type: string
    project_id: string
    private_key_id: string
    private_key: string
    client_email: string
    client_id: string
    auth_uri: string
    token_uri: string
    auth_provider_x509_cert_url: string
    client_x509_cert_url: string
}
export type BedrockToolInfo = {
    googleDriveKeyInfo: GoogleDriveKeyInfo
    folderID: string
}

export default class ConfigManager {
    client: Client
    prefix: string
    appeal: string
    vanity: string
    logging: loggingConfig
    guilds: GuildCategories & { youtube: string }
    suggestions: GuildCategories & { discussion: GuildCategories }
    suggestionOffset: GuildCategories<number>
    reactionRoles: ReactionRole
    emojis: EmojiList
    colors: ColorPalette & { suggestions: SuggestionCategories }
    assets: AssetList
    rules: string[]
    buildTeamInvites: Field
    token: string
    modpackAuth: string
    database: DatabaseInfo
    bedrocktool: BedrockToolInfo

    constructor(client: Client) {
        this.client = client
    }

    async load(): Promise<void> {
        const configPath = path.join(__dirname, "../../../config.yml")
        const config = await fs.promises
            .readFile(configPath, "utf-8")
            .then(yaml => YAML.parse(yaml))
            .catch((e: Error) => {
                this.client.logger.error(`Failed to read config.yml: ${e.message}`)
                process.exit(1)
            })

        for (const [key, value] of Object.entries(config)) this[key] = value
    }

    unload(): void {
        for (const key of Object.keys(this)) {
            if (key !== "client") {
                delete this[key]
            }
        }
    }
}
