import Client from "../struct/Client.js"
import Command from "../struct/Command.js"
import Roles from "../util/roles.util.js"
import CommandMessage from "../struct/CommandMessage.js"
import Discord from "discord.js"
import { currentEnv, formatPunishmentTime, hexToRGB, loadSyncJSON5 } from "@buildtheearth/bot-utils"
const packageJson = loadSyncJSON5("package.json")

export default new Command({
    name: "info",
    aliases: [],
    description: "Get info about the bot!",
    permission: Roles.ANY,
    async run(this: Command, client: Client, message: CommandMessage) {
        const embed = new Discord.MessageEmbed()
            .addFields([
                { name: "Environment", value: currentEnv() },
                { name: "Version", value: packageJson.version },
                {
                    name: "Uptime",
                    value: formatPunishmentTime(Math.floor(process.uptime()) * 1000, true)
                }
            ])
            .setTitle("Info about main-bot")
            .setThumbnail(client.user.displayAvatarURL())
            .setColor(hexToRGB(client.config.colors.info))

        await message.send({ embeds: [embed] })
    }
})
