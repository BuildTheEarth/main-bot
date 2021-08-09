import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import truncateString from "../util/truncateString"
import Discord from "discord.js"

export default new Command({
    name: "reload",
    aliases: ["re"],
    description: "Reload a command/an event handler/the config/a module/all modules.",
    permission: Roles.BOT_DEVELOPER,
    usage: "<command | event | 'config' | filename | 'all'>",
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const name = args.consume()
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
            return client.channel.sendError(
                message.channel,
                `Unknown command, event handler, or module \`${truncated}\`.`
            )
        }

        let fullname: string
        if (command) {
            fullname = `\`${command.name}\` command`
            client.commands.unloadOne(command.name)
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

        client.channel.sendSuccess(message.channel, `Reloaded ${fullname}.`)
    }
})
