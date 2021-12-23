import Client from "../struct/Client"
import Command from "../struct/Command"
import Roles from "../util/roles"
import Discord from "discord.js"
import CommandMessage from "../struct/CommandMessage"

export default new Command({
    name: "ping",
    aliases: [],
    description: "Ping pong!",
    permission: Roles.ANY,
    async run(this: Command, _client: Client, message: CommandMessage) {
        const pinger = await message.send({ content: ":ping_pong: Pinging..." })
        const ping = Date.now() - message.createdTimestamp
        if (pinger) {
            try {
                await (pinger as CommandMessage).edit({
                    content: `:ping_pong: Pong! **${ping.toLocaleString()}ms**.`
                })
            } catch {
                message.edit({
                    content: `:ping_pong: Pong! **${ping.toLocaleString()}ms**.`
                })
            }
        }
    }
})
