import Discord from "discord.js"
import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Command from "../struct/Command"
import Roles from "../util/roles"
import noop from "../util/noop"
import fetch from "node-fetch"
import MinecraftServerStatus from "../typings/MinecraftServerStatus"

const API_URL = "https://api.mcsrvstat.us/2/"
const JAVA_URL = `${API_URL}network.buildtheearth.net`
const BEDROCK_URL = `${API_URL}bedrock.buildtheearth.net`

export default new Command({
    name: "status",
    aliases: ["server", "network"],
    description: "Check the status of the Minecraft network.",
    permission: Roles.ANY,
    usage: "",
    async run(this: Command, _client: Client, message: Message) {
        const status = (url: string) =>
            fetch(url)
                .then(res => res.json())
                .catch(noop) as Promise<MinecraftServerStatus>
        const java = await status(JAVA_URL)
        const bedrock = await status(BEDROCK_URL)

        if (!java?.online) {
            return message.channel.sendError("The network is currently offline. :(")
        } else {
            const embed: Discord.MessageEmbedOptions = {
                description: "The network is online!",
                fields: [{ name: "Players", value: null }],
                footer: { text: "IP: BuildTheEarth.net, bedrock.BuildTheEarth.net" }
            }

            if (java.players.online) {
                let players = `There are **${java.players.online}** / **${java.players.max}** players online.\n\n`
                if (java?.info?.clean)
                    players += java.info.clean
                        .filter(line => line.startsWith("["))
                        .join("\n")
                        .replace(/\[(\d+)]/g, "**$1**")

                embed.fields[0].value = players
            } else {
                embed.fields[0].value = "There are no players online right now."
            }

            embed.fields.push({
                name: "Bedrock",
                value: bedrock?.online
                    ? "The Bedrock proxy is online!"
                    : "The Bedrock proxy is offline right now."
            })

            await message.channel.sendSuccess(embed)
        }
    }
})
