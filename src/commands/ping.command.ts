import Client from "../struct/Client.js"
import Command from "../struct/Command.js"

import CommandMessage from "../struct/CommandMessage.js"
import Args from "../struct/Args.js"

export default new Command({
    name: "ping",
    aliases: ["bing"],
    description: "Ping pong!",
    permission: globalThis.client.roles.ANY,
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const emoji = "🏓"
        const letter = args.command === "bing" ? "B" : "P"

        await message.continue()
        await message.send({
            content: `${emoji} ${letter}ong! **${client.ws.ping}ms**`
        })
    }
})
