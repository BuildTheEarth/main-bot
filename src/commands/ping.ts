import Client from "../struct/Client"
import Command from "../struct/Command"
import Roles from "../util/roles"
import CommandMessage from "../struct/CommandMessage"

export default new Command({
    name: "ping",
    aliases: [],
    description: "Ping pong!",
    permission: Roles.ANY,
    async run(this: Command, client: Client, message: CommandMessage) {
        await message.continue()
        await message.send({ content: `:ping_pong: Pong! **${client.ws.ping}ms**.` })
    }
})
