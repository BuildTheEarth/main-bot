import Discord from "discord.js"
import Command from "../Command"
import loadDir from "../../util/loadDir"

export default class CommandList extends Discord.Collection<string, Command> {
    async load() {
        const noop = cmd => cmd
        await loadDir<Command>(__dirname + "/../../commands/", noop, this)
    }

    search(name: string): Command {
        return this.find(command => {
            return command.name === name || command.aliases.includes(name)
        })
    }

    unloadOne(name: string) {
        this.delete(name)
        const path = require.resolve(__dirname + `../../commands/${name}.js`)
        delete require.cache[path]
    }

    async loadOne(name: string) {
        const path = __dirname + `../../commands/${name}.js`
        const command: Command = (await import(path)).default
        this.set(command.name, command)
    }
}
