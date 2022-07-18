import Client from "../struct/Client.js"
import Discord from "discord.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import GuildMember from "../struct/discord/GuildMember.js"

import CommandMessage from "../struct/CommandMessage.js"
import CommandUtils from "../util/CommandUtils.util.js"
import { truncateString } from "@buildtheearth/bot-utils"

export default new Command({
    name: "help",
    aliases: [],
    description: "Get a list of available commands (or info on one of them).",
    permission: globalThis.client.roles.ANY,
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
                return message.sendErrorMessage(
                    "unknownCommand",
                    truncateString(commandName, 32, "...")
                )
            if (!GuildMember.hasRole(member, command.permission, client))
                return message.sendErrorMessage("noPerms")

            const embed = CommandUtils.getHelpMessage(
                command,
                message.isSlashCommand(),
                client
            )

            return message.sendSuccess(embed)
        }

        let allowedCommands
        if (message.channel.type !== Discord.ChannelType.DM) {
            allowedCommands = client.commands.filter(command =>
                GuildMember.hasRole(member, command.permission, client)
            )
        }
        if (message.channel.type === Discord.ChannelType.DM) {
            allowedCommands = client.commands.filter(command => command.dms === true)
        }
        const formattedCommands = allowedCommands
            ?.map(command => `• **${command.name}:** ${command.description}`)
            .join("\n")

        return message.sendSuccess({
            author: { name: message.getMessage("yourCommands") },
            description: formattedCommands,
            fields: [
                {
                    name: message.getMessage("arguments"),
                    value: message.getMessage("helpCommandArguments")
                },
                {
                    name: "More info",
                    value: `To get info on a specific command, use the \`${client.config.prefix}help [command]\` command.`
                }
            ]
        })
    }
})
