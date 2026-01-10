import BotClient from "../struct/BotClient.js"
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
            optionType: "BOOLEAN"
        }
    ],
    async run(this: Command, client: BotClient, message: CommandMessage, args: Args) {
        if (!args.consumeBoolean("bye")) await message.react("👋").catch(() => null)
        process.exit(0)
    }
})
