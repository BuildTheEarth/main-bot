import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"

import CommandMessage from "../struct/CommandMessage.js"

export default new Command({
    name: "stop",
    aliases: ["die"],
    description: "Stop the bot.",
    permission: globalThis.client.roles.BOT_DEVELOPER,
    args: [
        {
            name: "bye",
            description: "Goodbye.",
            required: false,
            choices: ["bye"],
            optionType: "STRING"
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        if (!args.consumeIf("bye", "bye")) await message.react("👋").catch(() => null)
        process.exit(0)
    }
})
