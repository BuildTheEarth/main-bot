import Discord from "discord.js"
import Client from "../struct/Client"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles"

export default new Command({
    name: "help",
    aliases: [],
    description: "Get a list of available commands (or info on one of them).",
    permission: Roles.ANY,
    usage: "[command]",
    async run(this: Command, client: Client, message: Discord.Message, args: string) {
        if (args) {
            const command = client.commands.search(args)
            if (!command) {
                return message.channel.send({
                    embed: {
                        color: client.config.colors.error,
                        description: `Unknown command \`${args.slice(0, 32)}\`.`
                    }
                })
            }

            const embed = {
                color: client.config.colors.success,
                author: { name: command.name },
                description: command.description,
                fields: [
                    {
                        name: "Usage",
                        value: `\`${client.config.prefix}${command.name} ${command.usage}\``
                    }
                ]
            }
            if (command.aliases.length)
                embed.fields.push({
                    name: "Aliases",
                    value: `\`${command.aliases.join("`, `")}\``
                })

            return message.channel.send({ embed })
        }

        const member = <GuildMember>message.member
        const allowedCommands = client.commands.filter(command =>
            member.hasStaffPermission(command.permission)
        )
        const commandNames = allowedCommands.map(command => command.name)
        const commandList = `\`${commandNames.join("`, `")}\``
        return message.channel.send({
            embed: {
                author: { name: "Here are all the commands you have access to:" },
                color: client.config.colors.success,
                description: `${commandList}`
            }
        })
    }
})
