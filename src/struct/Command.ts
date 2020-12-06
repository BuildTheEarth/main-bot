import Discord from "discord.js"
import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "./Args"

export default class Command implements CommandProperties {
    name: string
    aliases: string[]
    description: string
    permission: string | string[]
    usage: string
    subcommands: SubCommandProperties[]
    run: (client: Client, message: Message, args: Args) => void

    constructor(properties: CommandProperties) {
        this.name = properties.name
        this.aliases = properties.aliases
        this.description = properties.description
        this.permission = properties.permission
        this.usage = properties.usage
        this.subcommands = (properties.subcommands || []).map(sub => {
            if (!sub.permission) sub.permission = properties.permission
            return sub
        })
        this.run = properties.run
    }
}

export interface CommandProperties extends SubCommandProperties {
    aliases: string[]
    subcommands?: SubCommandProperties[]
    permission: string | string[]
    run: (client: Discord.Client, message: Discord.Message, args: Args) => void
}

export interface SubCommandProperties {
    name: string
    description: string
    permission?: string | string[]
    usage: string
}
