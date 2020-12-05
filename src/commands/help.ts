import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles"
import truncateString from "../util/truncateString"

export default new Command({
    name: "help",
    aliases: [],
    description: "Get a list of available commands (or info on one of them).",
    permission: Roles.ANY,
    usage: "[command]",
    async run(this: Command, client: Client, message: Message, args: string) {
        const member = <GuildMember>message.member

        if (args) {
            const command = client.commands.search(args)
            if (!command)
                return message.channel.sendError(
                    `Unknown command \`${truncateString(args, 32, "...")}\`.`
                )
            if (!member.hasStaffPermission(command.permission))
                return message.channel.sendError(
                    "You don't have permission to use that command!"
                )

            const embed = {
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

            return message.channel.sendSuccess(embed)
        }

        const allowedCommands = client.commands.filter(command =>
            member.hasStaffPermission(command.permission)
        )
        const commandNames = allowedCommands.map(command => command.name)
        const commandList = `\`${commandNames.join("`, `")}\``
        return message.channel.sendSuccess({
            author: { name: "Here are all the commands you have access to:" },
            description: commandList
        })
    }
})
