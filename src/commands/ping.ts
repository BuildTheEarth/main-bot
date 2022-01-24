import Client from "../struct/Client"
import Command from "../struct/Command"
import Roles from "../util/roles"
import CommandMessage from "../struct/CommandMessage"
import Args from "../struct/Args"

export default new Command({
    name: "ping",
    aliases: ["bing"],
    description: "Ping pong!",
    permission: Roles.ANY,
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        await message.continue()
        await message.send({
            content: `:ping_pong: ${args.command === "bing" ? "B" : "P"}ong! **${
                client.ws.ping
            }ms**.`
        })
    }
})
