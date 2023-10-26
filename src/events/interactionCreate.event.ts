import Discord, { AutocompleteInteraction, ModalSubmitInteraction } from "discord.js"
import Args from "../struct/Args.js"
import Client from "../struct/Client.js"
import CommandMessage from "../struct/CommandMessage.js"
import GuildMember from "../struct/discord/GuildMember.js"
import Role from "../struct/discord/Role.js"

import chalk = require("chalk")
import ModerationMenu from "../entities/ModerationMenu.entity.js"
import createSuggestion from "../modals/suggest.modal.js"
import createBanner from "../modals/banner.modal.js"
import createSnippet from "../modals/snippet.modal.js"
import createPlaceholder from "../modals/placeholder.modal.js"
import editSuggestion from "../modals/suggestion.modal.js"
import createSuspiciousUser from "../modals/suspicioususer.modal.js"
import _ from "lodash"
import SuspiciousUser from "../entities/SuspiciousUser.entity.js"
import languageDropdown from "../dropdowns/language.dropdown.js"
import teamMenu from "../menus/team.menu.js"
import CommandAction from "../entities/CommandAction.entity.js"

export default async function (
    this: Client,
    interaction: Discord.Interaction
): Promise<unknown> {
    if (interaction.user.bot) return

    if (interaction.type === Discord.InteractionType.MessageComponent) {
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId.split(".")[0] === "info") {
                if (interaction.customId === "info.languages")
                    return await languageDropdown(this, interaction)
            } else {
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
                        content: client.messages.getMessage(
                            "noPermsMod",
                            interaction.locale
                        )
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
        }
        if (interaction.isButton()) {
            if (_.startsWith(interaction.customId, "modmenu.")) {
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
                        content: client.messages.getMessage(
                            "noPermsMod",
                            interaction.locale
                        )
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
            if (_.startsWith(interaction.customId, "suspicious_user.")) {
                return await SuspiciousUser.buttonPress(this, interaction)
            }
            if (_.startsWith(interaction.customId, "info.teams")) {
                return await teamMenu(this, interaction)
            }
        }
    }

    if (interaction.isChatInputCommand()) {
        const args = new Args("", new CommandMessage(interaction, this))
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
                    : (interaction.user as Discord.User).tag

            try {
                await command.run(this, new CommandMessage(interaction, this), args)
            } catch (error) {
                this.response.sendError(
                    new CommandMessage(interaction, this),
                    "An unknown error occurred! Please contact one of the bot developers for help."
                )
                if (error instanceof Error) {
                    const stack = (error.stack as string)
                        .split("\n")
                        .map(line => "    " + line)
                        .join("\n")
                    return this.logger.error(
                        `${label} ${tag} tried to run '${command.name}' command:\n${stack}`
                    )
                }
            }

            this.logger.info(`${label} ${tag} ran '${command.name}' command.`)

            const cInfo = new CommandAction()
            cInfo.channel = interaction.channel?.id ?? "00000000000000000"
            cInfo.command = command.name
            const subcmd = interaction.options.getSubcommand(false)
            if (subcmd) cInfo.subcommand = subcmd
            const subcmdgr = interaction.options.getSubcommandGroup(false)
            if (subcmdgr) cInfo.subcommandGroup = subcmdgr
            cInfo.guild = interaction.guildId ?? "00000000000000000"
            cInfo.executor = interaction.user.id
            await cInfo.save()
            return
        }
    }

    if (interaction.type === Discord.InteractionType.ModalSubmit) {
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
            if (type === "suspicioususermodal") {
                return createSuspiciousUser(interaction, this)
            }
        }
    }

    if (interaction.type === Discord.InteractionType.ApplicationCommandAutocomplete) {
        if (interaction instanceof AutocompleteInteraction) {
            const cmd = interaction.commandName
            const command = this.commands.search(cmd)
            const argName = interaction.options.getFocused(true).name
            console.log(argName)
            if (command && command.args) {
                for (const arg of command.args) {
                    if (arg.name == argName) {
                        if (arg.autocomplete?.enable) {
                            await arg.autocomplete.handler(this, interaction)
                        }
                    }
                }
            }
        }
    }
}
