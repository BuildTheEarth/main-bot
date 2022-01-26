import Client from "../struct/Client"
import Command from "../struct/Command"
import Roles from "../util/roles"
import CommandMessage from "../struct/CommandMessage"
import Args from "../struct/Args"
import packageJson from "../../package.json"
import Discord from "discord.js"
import currentEnv from "../util/currentEnv"
import formatPunishmentTime from "../util/formatPunishmentTime"
import hexToRGB from "../util/hexToRGB"

export default new Command({
    name: "info",
    aliases: ["uptime"],
    description: "Get info about the bot!",
    permission: Roles.ANY,
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
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

        await message.send({embeds: [embed]})
    }
})
