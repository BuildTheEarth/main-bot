import Discord from "discord.js"
import Client from "../struct/Client"
import Command from "../struct/Command"
import roles from "../util/roles"

export default new Command({
    name: "reload",
    aliases: [],
    description: "Reload a command.",
    permission: roles.BOT_DEVELOPER,
    usage: "<command>",
    async run(client: Client, message: Discord.Message, args: string) {
        const commandName = args.split(/ +/)[0]
        const command = client.commands.search(commandName.toLowerCase())
        if (!command) {
            return message.channel.send({
                embed: {
                    color: client.config.colors.error,
                    description: `Unknown command \`${commandName}\`.`
                }
            })
        }

        client.commands.unloadOne(command.name)
        await client.commands.loadOne(command.name)

        message.channel.send({
            embed: {
                color: client.config.colors.success,
                description: `Reloaded command \`${command.name}\`.`
            }
        })
    }
})
