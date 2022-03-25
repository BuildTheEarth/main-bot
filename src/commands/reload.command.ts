import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import Roles from "../util/roles.util.js"
import CommandMessage from "../struct/CommandMessage.js"
import { truncateString } from "@buildtheearth/bot-utils"

export default new Command({
    name: "reload",
    aliases: [],
    description: "Reload a command/an event handler/the config/a module/all modules.",
    permission: Roles.BOT_DEVELOPER,
    args: [
        {
            name: "module",
            description:
                "Module to reload (command | event | 'config' | filename | 'all')",
            required: true,
            optionType: "STRING"
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const name = args.consume("module")
        const command = client.commands.search(name)
        const handler = client.events.get(name)
        const config = name.toLowerCase() === "config"
        let file: string
        try {
            file = require.resolve(name)
        } catch {
            file = null
        }
        const all = name.toLowerCase() === "all"

        if (!command && !handler && !config && !file && !all) {
            const truncated = truncateString(name, 32, "...")
            return client.response.sendError(
                message,
                `Unknown command, event handler, or module \`${truncated}\`.`
            )
        }

        await message.continue()

        let fullname: string
        if (command) {
            fullname = `\`${command.name}\` command`
            await client.commands.unloadOne(command.name)
            await client.commands.loadOne(command.name)
        } else if (handler) {
            fullname = `\`${name}\` event handler`
            client.events.unregisterOne(name)
            client.events.unloadOne(name)
            await client.events.loadOne(name)
            client.events.registerOne(name)
        } else if (config) {
            fullname = "config"
            client.config.unload()
            await client.config.load()
        } else if (file) {
            fullname = `\`${name}\` module`
            delete require.cache[file]
            await import(file)
        } else if (all) {
            fullname = "all modules"
            for (const filename of Object.keys(require.cache)) {
                delete require.cache[filename]
                await import(filename)
            }
        }

        client.response.sendSuccess(message, `Reloaded ${fullname}.`)
    }
})
