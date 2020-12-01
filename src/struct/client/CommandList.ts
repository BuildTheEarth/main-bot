import Discord from "discord.js"
import Command from "../Command"
import loadDir from "../../util/loadDir"

export default class CommandList extends Discord.Collection<string, Command> {
    async load() {
        const noop = cmd => cmd
        await loadDir<Command>(__dirname + "/../commands/", noop, this)
    }

    search(name: string): Command {
        return this.find(command => {
            return command.name === name || command.aliases.includes(name)
        })
    }
}
