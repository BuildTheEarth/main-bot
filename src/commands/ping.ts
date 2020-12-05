import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Command from "../struct/Command"
import Roles from "../util/roles"

export default new Command({
    name: "ping",
    aliases: [],
    description: "Ping pong!",
    permission: Roles.ANY,
    usage: "",
    async run(this: Command, _client: Client, message: Message) {
        const pinger = await message.channel.send(":ping_pong: Pinging...")
        const ping = pinger.createdTimestamp - message.createdTimestamp
        pinger.edit(`:ping_pong: Pong! **${ping.toLocaleString()}ms**.`)
    }
})
