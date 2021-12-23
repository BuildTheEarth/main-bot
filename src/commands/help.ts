import Client from "../struct/Client"
import Discord from "discord.js"
import Args from "../struct/Args"
import Command from "../struct/Command"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles"
import truncateString from "../util/truncateString"
import CommandMessage from "../struct/CommandMessage"
import CommandUtils from "../util/CommandUtils"
export default new Command({
    name: "help",
    aliases: [],
    description: "Get a list of available commands (or info on one of them).",
    permission: Roles.ANY,
    args: [
        {
            name: "command",
            description: "Command to get help of",
            required: false,
            optionType: "STRING"
        }
    ],
    dms: true,
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const member = (
            message.guild
                ? message.member
                : await client.customGuilds
                      .main()
                      .members.fetch({ user: message.member, cache: true })
                      .catch(() => null)
        ) as Discord.GuildMember
        const commandName = args.consume("command")

        if (commandName) {
            const command = client.commands.search(commandName)
            if (!command)
                return client.response.sendError(
                    message,
                    `Unknown command \`${truncateString(commandName, 32, "...")}\`.`
                )
            if (!GuildMember.hasRole(member, command.permission))
                return client.response.sendError(
                    message,
                    "You don't have permission to use that command!"
                )

            const embed = CommandUtils.getHelpMessage(
                command,
                message.isSlashCommand(),
                client
            )

            return client.response.sendSuccess(message, embed)
        }

        const allowedCommands = client.commands.filter(command =>
            GuildMember.hasRole(member, command.permission)
        )

        const formattedCommands = allowedCommands
            .map(command => `• **${command.name}:** ${command.description}`)
            .join("\n")

        return client.response.sendSuccess(message, {
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
