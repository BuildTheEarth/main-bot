import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import CommandMessage from "../struct/CommandMessage"

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
