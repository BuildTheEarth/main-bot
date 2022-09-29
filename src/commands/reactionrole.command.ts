import Client from "../struct/Client.js"
import Command from "../struct/Command.js"

import CommandMessage from "../struct/CommandMessage.js"
import Args from "../struct/Args.js"

export default new Command({
    name: "reactionroles",
    aliases: ["rr"],
    description: "Manage reaction roles",
    permission: [globalThis.client.roles.MANAGER, globalThis.client.roles.BOT_DEVELOPER],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        console.log(client) //debug info
        message.sendError("Will be added soon!")
    }
})
