import chalk = require("chalk")
import Discord from "discord.js"

export default class Role {
    static format(role: Discord.Role): string {
        // "#000000" is not black, but the default role color
        if (role) {
            const color =
                role.hexColor === "#000000" ? chalk.white : chalk.hex(role.hexColor)
            return color(role.name)
        } else return chalk.white("Default")
    }
}
