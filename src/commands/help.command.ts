import BotClient from "../struct/BotClient.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import BotGuildMember from "../struct/discord/BotGuildMember.js"

import CommandMessage from "../struct/CommandMessage.js"
import CommandUtils from "../util/commandUtils.util.js"
import { truncateString } from "@buildtheearth/bot-utils"
import getHelpMessage from "../util/helpCommandUtils.util.js"
import { ChannelType, GuildMember } from "discord.js"

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
    async run(this: Command, client: BotClient, message: CommandMessage, args: Args) {
        const member = (
            message.guild
                ? message.member
                : await client.customGuilds
                      .main()
                      .members.fetch({ user: message.member, cache: true })
                      .catch(() => null)
        ) as GuildMember
        const commandName = args.consume("command")

        if (commandName) {
            const command = client.customCommands.search(commandName)
            if (!command)
                return message.sendErrorMessage(
                    "unknownCommand",
                    truncateString(commandName, 32, "...")
                )
            if (!BotGuildMember.hasRole(member, command.permission, client))
                return message.sendErrorMessage("noPerms")

            const embed = getHelpMessage(
                command,
                message.isSlashCommand(),
                client
            )

            return message.sendSuccess(embed)
        }

        let allowedCommands
        if (message.channel.type !== ChannelType.DM) {
            allowedCommands = client.customCommands.filter(command =>
                BotGuildMember.hasRole(member, command.permission, client)
            )
        }
        if (message.channel.type === ChannelType.DM) {
            allowedCommands = client.customCommands.filter(
                command => command.dms === true
            )
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
