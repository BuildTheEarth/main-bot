import Client from "../struct/Client"
import Command from "../struct/Command"
import Roles from "../util/roles"
import CommandMessage from "../struct/CommandMessage"
import Args from "../struct/Args"

export default new Command({
    name: "ping",
    aliases: ["bing", "ding"],
    description: "Ping pong!",
    permission: Roles.ANY,
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const emoji = ${args.command === "ding" ? "🔔" : "🏓"}
        const letter = args.command === "bing" ? "B" : args.command === "ding" ? "D" : "P"
        
        await message.continue()
        await message.send({
            content: `${emoji} ${letter}ong! **${client.ws.ping}ms**`
        })
    }
})
