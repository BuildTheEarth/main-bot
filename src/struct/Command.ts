import Client from "../struct/Client"
import Args from "./Args"
import ApiTypes from "discord-api-types/v9"
import CommandMessage from "./CommandMessage"

export default class Command implements CommandProperties {
    name: string
    aliases: string[]
    inheritGlobalArgs?: boolean
    description: string
    permission: string | string[]
    basesubcommand?: string
    dms: boolean
    args?: CommandArgs[]
    seperator?: string
    subcommands: SubCommandProperties[]
    run: (client: Client, message: CommandMessage, args: Args) => void | Promise<void>

    constructor(properties: CommandProperties) {
        this.seperator = properties.seperator || " "
        this.args = properties.args
        this.name = properties.name
        this.basesubcommand = properties.basesubcommand || null
        this.inheritGlobalArgs = properties.inheritGlobalArgs || false
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
    subcommands?: SubCommandProperties[]
    permission: string | string[]
    basesubcommand?: string
    dms?: boolean
    seperator?: string
    run: (client: Client, message: CommandMessage, args: Args) => void
}

export interface SubCommandProperties {
    name: string
    description: string
    permission?: string | string[]
    group?: boolean
    subcommands?: SubCommandProperties[]
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
    choices?: Array<any>
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
        ApiTypes.ChannelType.DM | ApiTypes.ChannelType.GroupDM
    >[]
}
