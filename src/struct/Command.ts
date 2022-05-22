import Client from "../struct/Client.js"
import Args from "./Args.js"
import ApiTypes = require("discord-api-types/v10")
import CommandMessage from "./CommandMessage.js"

export default class Command implements CommandProperties {
    name: string
    aliases: string[]
    inheritGlobalArgs?: boolean
    description: string
    permission: string[] | string[][]
    basesubcommand?: string | null
    dms: boolean
    args?: CommandArgs[]
    seperator?: string
    subcommands: SubCommandProperties[] | null
    devOnly?: boolean
    run: (client: Client, message: CommandMessage, args: Args) => void | Promise<void>

    constructor(properties: CommandProperties) {
        this.seperator = properties.seperator || " "
        this.args = properties.args
        this.name = properties.name
        this.basesubcommand = properties.basesubcommand || null
        this.inheritGlobalArgs = properties.inheritGlobalArgs || false
        this.devOnly = properties.devOnly || false
        this.aliases = properties.aliases
        this.description = properties.description
        this.permission = properties.permission
        this.dms = properties.dms || false
        this.subcommands = (properties.subcommands || []).map(sub => {
            if (!sub.permission) sub.permission = properties.permission
            return sub
        })
        this.run = properties.run.bind(this)
    }
}

export interface CommandProperties extends SubCommandProperties {
    aliases: string[]
    inheritGlobalArgs?: boolean
    devOnly?: boolean
    subcommands?: SubCommandProperties[] | null
    permission: string[] | string[][]
    basesubcommand?: string | null
    dms?: boolean
    seperator?: string
    run: (client: Client, message: CommandMessage, args: Args) => void
}

export interface SubCommandProperties {
    name: string
    description: string
    permission?: string[] | string[][]
    group?: boolean
    subcommands?: SubCommandProperties[] | null
    args?: CommandArgs[]
    seperator?: string
}
export const ArgTypes = {
    STRING: "STRING",
    INTEGER: "INTEGER",
    NUMBER: "NUMBER",
    BOOLEAN: "BOOLEAN",
    USER: "USER",
    CHANNEL: "CHANNEL",
    ROLE: "ROLE",
    MENTIONABLE: "MENTIONABLE"
}

export interface CommandArgs {
    name: string
    description: string
    choices?: Array<number | string>
    required: boolean
    optionType:
        | "STRING"
        | "INTEGER"
        | "NUMBER"
        | "BOOLEAN"
        | "USER"
        | "CHANNEL"
        | "ROLE"
        | "MENTIONABLE"
    channelTypes?: Exclude<
        ApiTypes.ChannelType,
        ApiTypes.ChannelType.GroupDM | ApiTypes.ChannelType.DM
    >[]
}
