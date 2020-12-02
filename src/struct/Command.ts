import Discord from "discord.js"

export default class Command implements CommandProperties {
    name: string
    aliases: string[]
    description: string
    permission: string | string[]
    usage: string
    run: (client: Discord.Client, message: Discord.Message, args: string) => void

    constructor(properties: CommandProperties) {
        this.name = properties.name
        this.aliases = properties.aliases
        this.description = properties.description
        this.permission = properties.permission
        this.usage = properties.usage
        this.run = properties.run
    }
}

export type CommandProperties = {
    name: string
    aliases: string[]
    description: string
    permission: string | string[]
    usage: string
    run: (client: Discord.Client, message: Discord.Message, args: string) => void
}
