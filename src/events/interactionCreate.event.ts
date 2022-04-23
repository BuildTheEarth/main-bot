import Discord, { ModalSubmitInteraction } from "discord.js"
import Args from "../struct/Args.js"
import Client from "../struct/Client.js"
import CommandMessage from "../struct/CommandMessage.js"
import GuildMember from "../struct/discord/GuildMember.js"
import Role from "../struct/discord/Role.js"

import chalk from "chalk"
import ModerationMenu from "../entities/ModerationMenu.entity.js"
import createSuggestion from "../modals/suggest.modal.js"
import createBanner from "../modals/banner.modal.js"
import createSnippet from "../modals/snippet.modal.js"
import createPlaceholder from "../modals/placeholder.modal.js"
import editSuggestion from "../modals/suggestion.modal.js"

export default async function (
    this: Client,
    interaction: Discord.Interaction
): Promise<unknown> {
    if (interaction.member.user.bot) return

    if (interaction.type === "MESSAGE_COMPONENT") {
        if (interaction.isSelectMenu()) {
            if (
                !GuildMember.hasRole(
                    interaction.member as Discord.GuildMember,
                    [
                        globalThis.client.roles.MODERATOR,
                        globalThis.client.roles.HELPER,
                        globalThis.client.roles.MANAGER
                    ],
                    this
                )
            ) {
                await interaction.deferUpdate()
                await interaction.followUp({
                    ephemeral: true,
                    content: client.messages.getMessage("noPermsMod", interaction.locale)
                })
                return
            }
            await interaction.deferUpdate()
            await ModerationMenu.updateMenu(
                interaction.customId.split(".")[1],
                interaction,
                this
            )
        }
        if (interaction.isButton()) {
            if (!interaction.customId.includes("modmenu.")) return
            if (
                interaction.customId.includes("modmenu.") &&
                !GuildMember.hasRole(
                    interaction.member as Discord.GuildMember,
                    [
                        globalThis.client.roles.MODERATOR,
                        globalThis.client.roles.HELPER,
                        globalThis.client.roles.MANAGER
                    ],
                    this
                )
            ) {
                await interaction.deferUpdate()
                await interaction.followUp({
                    ephemeral: true,
                    content: client.messages.getMessage("noPermsMod", interaction.locale)
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
                    command.permission,
                    this
                )
            //if (interaction.channel.type === "DM" && !command.dms) return
            if (command.permission !== globalThis.client.roles.ANY && !hasPermission)
                return

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

    if (interaction.type === "MODAL_SUBMIT") {
        if (interaction instanceof ModalSubmitInteraction) {
            const type = interaction.customId.split(".")[0]
            if (type === "suggestmodal") {
                return createSuggestion(interaction)
            }
            if (type === "bannermodal") {
                return createBanner(interaction)
            }
            if (type === "snippetmodal") {
                return createSnippet(interaction, this)
            }
            if (type === "placeholdermodal") {
                return createPlaceholder(interaction, this)
            }
            if (type === "suggestionmodal") {
                return editSuggestion(interaction, this)
            }
        }
    }
}
