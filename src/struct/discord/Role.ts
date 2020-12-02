import chalk from "chalk"
import Discord from "discord.js"
import Client from "../Client"
import Guild from "./Guild"
import GuildMember from "./GuildMember"

export default class Role extends Discord.Role {
    client: Client
    guild: Guild
    members: Discord.Collection<string, GuildMember>

    format(): string {
        // "#000000" is not black, but the default role color
        const color = this.hexColor === "#000000" ? chalk.white : chalk.hex(this.hexColor)
        return color(this.name)
    }
}
