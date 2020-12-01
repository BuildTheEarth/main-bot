import chalk from "chalk"
import Discord from "discord.js"

export default class Role extends Discord.Role {
    format(): string {
        // "#000000" is not black, but the default role color
        const color = this.hexColor === "#000000" ? chalk.white : chalk.hex(this.hexColor)
        return color(this.name)
    }
}
