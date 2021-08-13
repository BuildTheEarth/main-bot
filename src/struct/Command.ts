import Client from "../struct/Client"
import Args from "./Args"
import Discord from "discord.js"

export default class Command implements CommandProperties {
    name: string
    aliases: string[]
    description: string
    permission: string | string[]
    usage: string
    dms: boolean
    subcommands: SubCommandProperties[]
    run: (client: Client, message: Discord.Message, args: Args) => void | Promise<void>

    constructor(properties: CommandProperties) {
        this.name = properties.name
        this.aliases = properties.aliases
        this.description = properties.description
        this.permission = properties.permission
        this.usage = properties.usage
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
    subcommands?: SubCommandProperties[]
    permission: string | string[]
    dms?: boolean
    run: (client: Client, message: Discord.Message, args: Args) => void
}

export interface SubCommandProperties {
    name: string
    description: string
    permission?: string | string[]
    usage: string
}
