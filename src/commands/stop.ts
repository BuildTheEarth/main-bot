import Discord from "discord.js"
import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"

export default new Command({
    name: "stop",
    aliases: ["close", "die", "bye", "adios", "shutdown", "off", "farewell"],
    description: "Stop the bot.",
    permission: Roles.BOT_DEVELOPER,
    usage: "['bye']",
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        if (!args.consumeIf("bye")) await message.react("👋").catch(() => null)
        process.exit(0)
    }
})
