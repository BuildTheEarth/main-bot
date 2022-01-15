import Discord from "discord.js"
import Args from "../struct/Args"
import Client from "../struct/Client"
import CommandMessage from "../struct/CommandMessage"
import GuildMember from "../struct/discord/GuildMember"
import Role from "../struct/discord/Role"
import Roles from "../util/roles"
import chalk from "chalk"
import ModerationMenu from "../entities/ModerationMenu"

export default async function (
    this: Client,
    interaction: Discord.Interaction
): Promise<unknown> {
    if (interaction.member.user.bot) return

    if (interaction.type === "MESSAGE_COMPONENT") {
        if (interaction.isSelectMenu()) {
            if (
                !GuildMember.hasRole(interaction.member as Discord.GuildMember, [
                    Roles.MODERATOR,
                    Roles.HELPER,
                    Roles.MANAGER
                ])
            ) {
                await interaction.deferUpdate()
                await interaction.followUp({
                    ephemeral: true,
                    content: this.messages.noPermsMod
                })
                return
            }
            await interaction.deferUpdate()
            await ModerationMenu.updateMenu(
                interaction.customId.split(".")[1],
                interaction
            )
        }
        if (interaction.isButton()) {
            if (!interaction.customId.includes("modmenu.")) return
            if (
                interaction.customId.includes("modmenu.") &&
                !GuildMember.hasRole(interaction.member as Discord.GuildMember, [
                    Roles.MODERATOR,
                    Roles.HELPER,
                    Roles.MANAGER
                ])
            ) {
                await interaction.deferUpdate()
                await interaction.followUp({
                    ephemeral: true,
                    content: this.messages.noPermsMod
                })
                return
            }
            await interaction.deferUpdate()
            if (interaction.customId.split(".")[2] === "pardon")
                await ModerationMenu.pardonConfirm(
                    interaction.customId.split(".")[1],
                    interaction,
                    this
                )
            if (interaction.customId.split(".")[2] === "punish")
                await ModerationMenu.punishConfirm(
                    interaction.customId.split(".")[1],
                    interaction,
                    this
                )
        }
    }

    if (interaction.type === "APPLICATION_COMMAND") {
        const args = new Args(
            "",
            new CommandMessage(interaction as Discord.CommandInteraction, this)
        )
        const command = this.commands.search(args.command)
        if (command) {
            const hasPermission =
                interaction.member &&
                GuildMember.hasRole(
                    interaction.member as Discord.GuildMember,
                    command.permission
                )
            if (interaction.channel.type === "DM" && !command.dms) return
            if (command.permission !== Roles.ANY && !hasPermission) return

            const label = interaction.member
                ? Role.format(
                      (interaction.member as Discord.GuildMember).roles
                          .highest as Discord.Role
                  )
                : chalk.blueBright("DMs")
            const tag =
                command.name === "suggest" && !interaction.guild
                    ? "(Anonymous)"
                    : (interaction.member.user as Discord.User).tag

            try {
                await command.run(
                    this,
                    new CommandMessage(interaction as Discord.CommandInteraction, this),
                    args
                )
            } catch (error) {
                this.response.sendError(
                    new CommandMessage(interaction as Discord.CommandInteraction, this),
                    "An unknown error occurred! Please contact one of the bot developers for help."
                )

                const stack = (error.stack as string)
                    .split("\n")
                    .map(line => "    " + line)
                    .join("\n")
                return this.logger.error(
                    `${label} ${tag} tried to run '${command.name}' command:\n${stack}`
                )
            }

            return this.logger.info(`${label} ${tag} ran '${command.name}' command.`)
        }
    }

    return
}
