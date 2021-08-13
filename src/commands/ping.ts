import Client from "../struct/Client"
import Command from "../struct/Command"
import Roles from "../util/roles"
import Discord from "discord.js"

export default new Command({
    name: "ping",
    aliases: [],
    description: "Ping pong!",
    permission: Roles.ANY,
    usage: "",
    async run(this: Command, _client: Client, message: Discord.Message) {
        const pinger = await message.channel.send(":ping_pong: Pinging...")
        const ping = pinger.createdTimestamp - message.createdTimestamp
        pinger.edit(`:ping_pong: Pong! **${ping.toLocaleString()}ms**.`)
    }
})
