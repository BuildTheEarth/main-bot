import Client from "../struct/Client.js"
import Command from "../struct/Command.js"
import fetch from "node-fetch"
import CommandMessage from "../struct/CommandMessage.js"
import Discord from "discord.js"
import {
    currentEnv,
    formatPunishmentTime,
    hexToRGB,
    loadSyncJSON5
} from "@buildtheearth/bot-utils"
const packageJson = loadSyncJSON5("package.json")
export default new Command({
    name: "info",
    aliases: [],
    description: "Get info about the bot!",
    permission: globalThis.client.roles.ANY,
    async run(this: Command, client: Client, message: CommandMessage) {
        const response = (await (
            await fetch(
                "https://api.github.com/repos/buildtheearth/main-bot/git/refs/heads/main"
            )
        ).json()) as { object: { url: string } }
        const commit = (await (await fetch(response.object.url)).json()) as {
            committer: { name: string }
            message: string
            html_url: string
        }
        const embed = new Discord.MessageEmbed()
            .addFields([
                { name: "Environment", value: currentEnv() },
                { name: "Version", value: packageJson.version },
                {
                    name: "Uptime",
                    value: formatPunishmentTime(Math.floor(process.uptime()) * 1000, true)
                },
                {
                    name: "Latest Commit",
                    value: `**[${commit.committer.name}](https://github.com/${commit.committer.name})** - [\`${commit.message}\`](${commit.html_url})`
                }
            ])
            .setTitle("Info about main-bot")
            .setThumbnail(client.user.displayAvatarURL())
            .setColor(hexToRGB(client.config.colors.info))
            .setDescription(
                "**[Github repo](https://github.com/BuildtheEarth/main-bot) | [Bug report](https://github.com/BuildTheEarth/main-bot/issues/new?template=bug_report.md)**"
            )
        await message.send({ embeds: [embed] })
    }
})
