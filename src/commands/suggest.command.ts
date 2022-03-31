import Discord from "discord.js"
import Client from "../struct/Client.js"
import Command from "../struct/Command.js"
import Roles from "../util/roles.util.js"
import CommandMessage from "../struct/CommandMessage.js"

export default new Command({
    name: "suggest",
    aliases: [],
    description: "Make a suggestion.",
    permission: Roles.ANY,
    dms: true,
    async run(this: Command, client: Client, message: CommandMessage) {
        await message.showModal("suggest")
    }
})
