import Discord from "discord.js"
import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Command from "../struct/Command"
import Roles from "../util/roles"
import fetch from "node-fetch"
import MinecraftServerStatusResponse from "../typings/MinecraftServerStatusResponse"

const API_URL = "https://api.mcsrvstat.us/2/network.buildtheearth.net"

export default new Command({
    name: "status",
    aliases: ["server"],
    description: "Check the status of the Minecraft network.",
    permission: Roles.ANY,
    usage: "",
    async run(this: Command, _client: Client, message: Message) {
        const status: MinecraftServerStatusResponse = await fetch(API_URL)
            .then(res => res.json())
            .catch(() => null)
        if (!status) return message.channel.sendError("Couldn't connect to the server!")

        if (!status.online) {
            return message.channel.sendError("The network is currently offline. :(")
        } else {
            const embed: Discord.MessageEmbedOptions = {
                description: "The network is online!",
                fields: [{ name: "Players", value: "" }],
                footer: { text: "IP: BuildTheEarth.net" }
            }

            if (status.players.online) {
                let players = `There are **${status.players.online}** / **${status.players.max}** players online.\n\n`
                const info = status.info.clean.filter(line => line.startsWith("["))
                players += info.join("\n").replace(/\[(\d+)]/g, "**$1**")

                embed.fields[0].value = players
            } else {
                embed.fields[0].value = "There are no players online right now."
            }

            await message.channel.sendSuccess(embed)
        }
    }
})
