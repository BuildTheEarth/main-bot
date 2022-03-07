import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import Roles from "../util/roles.util.js"
import CommandMessage from "../struct/CommandMessage.js"

export default new Command({
    name: "stop",
    aliases: ["close", "die", "bye", "adios", "shutdown", "off", "farewell"],
    description: "Stop the bot.",
    permission: Roles.BOT_DEVELOPER,
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
