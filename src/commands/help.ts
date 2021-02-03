import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles"
import truncateString from "../util/truncateString"
import humanizeArray from "../util/humanizeArray"

export default new Command({
    name: "help",
    aliases: [],
    description: "Get a list of available commands (or info on one of them).",
    permission: Roles.ANY,
    usage: "[command]",
    dms: true,
    async run(this: Command, client: Client, message: Message, args: Args) {
        const member = (message.guild
            ? message.member
            : await client.guilds.main.members
                  .fetch({ user: message.author, cache: true })
                  .catch(() => null)) as GuildMember
        const commandName = args.consume()

        if (commandName) {
            const command = client.commands.search(commandName)
            if (!command)
                return message.channel.sendError(
                    `Unknown command \`${truncateString(commandName, 32, "...")}\`.`
                )
            if (!member.hasStaffPermission(command.permission))
                return message.channel.sendError(
                    "You don't have permission to use that command!"
                )

            const usage = command.usage ? ` ${command.usage}` : ""
            const embed = {
                author: { name: command.name },
                description: command.description,
                fields: [
                    {
                        name: "Usage",
                        value: `\`${client.config.prefix}${command.name}${usage}\``
                    }
                ]
            }
            if (command.aliases.length)
                embed.fields.push({
                    name: "Aliases",
                    value: humanizeArray(command.aliases, true, "")
                })

            if (command.subcommands && command.subcommands.length) {
                const allowedSubcommands = command.subcommands.filter(sub =>
                    member.hasStaffPermission(sub.permission)
                )

                const formattedSubcommands = allowedSubcommands.map(sub => {
                    const usage = sub.usage ? ` ${sub.usage}` : ""
                    return `• **${sub.name}:** ${sub.description}\n  \`${client.config.prefix}${command.name} ${sub.name}${usage}\``
                })

                embed.fields.push({
                    name: "Subcommands",
                    value: formattedSubcommands.join("\n\n")
                })
            }

            return message.channel.sendSuccess(embed)
        }

        const allowedCommands = client.commands.filter(command =>
            member.hasStaffPermission(command.permission)
        )

        const formattedCommands = allowedCommands
            .map(command => `• **${command.name}:** ${command.description}`)
            .join("\n")

        return message.channel.sendSuccess({
            author: { name: "Here are all the commands you have access to:" },
            description: formattedCommands,
            fields: [
                {
                    name: "Arguments",
                    value:
                        "Argument names enclosed in `[square brackets]` are optional. " +
                        "Ones enclosed in `<angle brackets>` are required. " +
                        "Ones enclosed in `['single quotes']` mean that you should type their name to toggle an option " +
                        "(instead of providing a value of your own). " +
                        "Ones separated by `<vertical | bars>` mean you can choose between one of them (this also applies to quoted arguments)."
                },
                {
                    name: "More info",
                    value: `To get info on a specific command, use the \`${client.config.prefix}help [command]\` command.`
                }
            ]
        })
    }
})
