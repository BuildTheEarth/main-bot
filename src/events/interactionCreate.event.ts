import {
    AutocompleteInteraction,
    GuildMember,
    Interaction,
    InteractionType,
    MessageFlags,
    ModalSubmitInteraction,
    Role,
    User
} from "discord.js"
import Args from "../struct/Args.js"
import BotClient from "../struct/BotClient.js"
import CommandMessage from "../struct/CommandMessage.js"
import BotGuildMember from "../struct/discord/BotGuildMember.js"
import BotRole from "../struct/discord/BotRole.js"

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

export default async function (
    this: BotClient,
    interaction: Interaction
): Promise<unknown> {
    if (interaction.user.bot) return

    if (
        interaction.type != InteractionType.ApplicationCommand &&
        interaction.type != InteractionType.ApplicationCommandAutocomplete
    ) {
        const runInteraction = this.componentHandlers.findFromIdAndInteractionType(
            interaction.customId,
            interaction.type
        )
        if (runInteraction) await runInteraction.run(this, interaction)
    }

    if (interaction.type === InteractionType.MessageComponent) {
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId.split(".")[0] === "info") {
                if (interaction.customId === "info.languages")
                    return await languageDropdown(this, interaction)
            } else {
                if (
                    !BotGuildMember.hasRole(
                        interaction.member as GuildMember,
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
                        flags: MessageFlags.Ephemeral,
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
                    !BotGuildMember.hasRole(
                        interaction.member as GuildMember,
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
                        flags: MessageFlags.Ephemeral,
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
        const command = this.customCommands.search(args.command)
        if (command) {
            const hasPermission =
                interaction.member &&
                BotGuildMember.hasRole(
                    interaction.member as GuildMember,
                    command.permission,
                    this
                )
            //if (interaction.channel.type === "DM" && !command.dms) return
            if (command.permission !== globalThis.client.roles.ANY && !hasPermission) {
                return new CommandMessage(interaction, this).sendErrorMessage("noPerms")
            }

            const label = interaction.member
                ? BotRole.format(
                      (interaction.member as GuildMember).roles.highest as Role
                  )
                : chalk.blueBright("DMs")
            const tag =
                command.name === "suggest" && !interaction.guild
                    ? "(Anonymous)"
                    : (interaction.user as User).tag

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
            return
        }
    }

    if (interaction.isContextMenuCommand()) {
        const command = this.contextMenuCommandList.getByName(interaction.commandName)
        if (command) {
            const hasPermission =
                interaction.member &&
                BotGuildMember.hasRole(
                    interaction.member as GuildMember,
                    command.permissions,
                    this
                )
            if (command.permissions !== globalThis.client.roles.ANY && !hasPermission) {
                return interaction.reply({
                    content: client.messages.getMessage(
                        "noPerms",
                        interaction.locale
                    ),
                    ephemeral: true
                })
            }
            
            const label = interaction.member
                ? BotRole.format(
                      (interaction.member as GuildMember).roles.highest as Role
                  )
                : chalk.blueBright("DMs")
            const tag =
                command.name === "suggest" && !interaction.guild
                    ? "(Anonymous)"
                    : (interaction.user as User).tag
            try {
                await command.run(this, interaction)
            } catch (error) {
                interaction.reply(
                    {
                        content: "An unknown error occurred! Please contact one of the bot developers for help."
                    }   
                )
                if (error instanceof Error) {
                    const stack = (error.stack as string)
                        .split("\n")
                        .map(line => "    " + line)
                        .join("\n")
                    return this.logger.error(
                        `${label} ${tag} tried to run '${command.name}' context menu command:\n${stack}`
                    )
                }
            }

            this.logger.info(
                `${label} ${tag} ran '${command.name}' context menu command.`
            )
            return
        }
    }

    if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction instanceof ModalSubmitInteraction) {
            const type = interaction.customId.split(".")[0]
            if (type === "suggestmodal") {
                return createSuggestion(interaction, this)
            }
            if (type === "bannermodal") {
                return createBanner(interaction, this)
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

    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
        if (interaction instanceof AutocompleteInteraction) {
            const cmd = interaction.commandName
            const command = this.customCommands.search(cmd)
            const argName = interaction.options.getFocused(true).name

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
