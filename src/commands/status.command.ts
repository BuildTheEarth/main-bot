import Discord from "discord.js"
import Client from "../struct/Client.js"
import Command from "../struct/Command.js"

import { noop } from "@buildtheearth/bot-utils"
import fetch from "node-fetch"
import MinecraftServerStatus from "../typings/MinecraftServerStatus.js"
import CommandMessage from "../struct/CommandMessage.js"

const API_URL = "https://api.mcsrvstat.us/2/"
const JAVA_URL = `${API_URL}network.buildtheearth.net`
const BEDROCK_URL = `${API_URL}bedrock.buildtheearth.net`

export default new Command({
    name: "status",
    aliases: [],
    description: "Check the status of the Minecraft network.",
    permission: globalThis.client.roles.ANY,
    async run(this: Command, client: Client, message: CommandMessage) {
        await message.continue()

        const status = (url: string) =>
            fetch(url)
                .then(res => res.json())
                .catch(noop) as Promise<MinecraftServerStatus>
        const java = await status(JAVA_URL)
        const bedrock = await status(BEDROCK_URL)

        if (!java?.online) {
            return message.sendErrorMessageSeen("networkOffline")
        } else {
            const embed: Discord.MessageEmbedOptions = {
                description: message.getMessage("networkOnline"),
                fields: [{ name: message.getMessage("players"), value: null }],
                footer: { text: "IP: BuildTheEarth.net, bedrock.BuildTheEarth.net" }
            }

            if (java.players.online) {
                let players = message.getMessage(
                    "playersOnline",
                    java.players.online,
                    java.players.max
                )
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

            await message.sendSuccess(embed)
        }
    }
})
