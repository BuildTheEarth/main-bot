import Client from "../struct/Client.js"
import Command from "../struct/Command.js"

import CommandMessage from "../struct/CommandMessage.js"

export default new Command({
    name: "suggest",
    aliases: [],
    description: "Make a suggestion.",
    permission: globalThis.client.roles.ANY,
    dms: true,
    async run(this: Command, _client: Client, message: CommandMessage) {
        await message.showModal("suggest")
    }
})
