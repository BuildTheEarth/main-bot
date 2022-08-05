import Discord, { FetchedThreads } from "discord.js"
import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import Suggestion, {
    SuggestionStatus,
    SuggestionStatuses
} from "../entities/Suggestion.entity.js"

import path from "path"
import url from "url"
import {
    hexToNum,
    humanizeArray,
    loadSyncJSON5,
    truncateString
} from "@buildtheearth/bot-utils"
import typeorm from "typeorm"
import { noop } from "@buildtheearth/bot-utils"
const suggestionStatusActions = loadSyncJSON5(
    path.join(
        path.dirname(url.fileURLToPath(import.meta.url)) +
            "../../../config/extensions/suggestionStatusActions.json5"
    )
)
import GuildMember from "../struct/discord/GuildMember.js"
import CommandMessage from "../struct/CommandMessage.js"

export default new Command({
    name: "suggestion",
    aliases: ["suggestions"],
    description: "Manage suggestions.",
    permission: globalThis.client.roles.ANY,
    dms: true,
    subcommands: [
        {
            name: "link",
            description: "Link to a suggestion.",
            args: [
                {
                    name: "number",
                    description: "Suggestion number",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "edit",
            description: "Edit a suggestion.",
            args: [
                {
                    name: "number",
                    description: "Suggestion number",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "delete",
            description: "Delete a suggestion.",
            permission: globalThis.client.roles.ANY,
            args: [
                {
                    name: "number",
                    description: "Suggestion number.",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "status",
            description: "Change the status of a suggestion.",
            permission: [
                globalThis.client.roles.SUGGESTION_TEAM,
                globalThis.client.roles.MANAGER
            ],
            args: [
                {
                    name: "number",
                    description: "Suggestion number.",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "status",
                    description: "Suggestion status.",
                    required: true,
                    optionType: "STRING",
                    choices: [
                        "approved",
                        "denied",
                        "duplicate",
                        "forwarded",
                        "in-progress",
                        "information",
                        "invalid"
                    ]
                },
                {
                    name: "reason",
                    description: "Suggestion status reason.",
                    required: false,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "search",
            description: "Search for suggestions.",
            permission: globalThis.client.roles.ANY,
            args: [
                {
                    name: "field",
                    description: "Field to edit.",
                    required: false,
                    optionType: "STRING",
                    choices: ["title", "body", "teams"]
                },
                {
                    name: "query",
                    description: "Search query.",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "status",
                    description: "Suggestion statuses to search for.",
                    required: false,
                    optionType: "STRING"
                }
            ]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const Suggestions = client.db?.getRepository(Suggestion)
        const staff = message.guild?.id === client.config.guilds.staff
        const category = staff ? "staff" : "main"
        const canManage = message.member
            ? GuildMember.hasRole(
                  message.member,
                  [
                      globalThis.client.roles.SUGGESTION_TEAM,
                      globalThis.client.roles.MANAGER
                  ],
                  client
              )
            : false

        if (message.channel.id === client.config.suggestions[category] && !canManage) {
            const messages = await message.sendErrorMessage("anotherChannel")
            message.delete().catch(noop)
            setTimeout(() => {
                if (messages) messages.delete().catch(noop)
            }, 10000)
            return
        }

        const subcommand = args.consumeSubcommand()
        const availableSubcommands = this.subcommands?.filter(sub =>
            message.member
                ? GuildMember.hasRole(
                      message.member,
                      sub.permission || this.permission,
                      client
                  )
                : false
        )

        const availableSubcommandNames = availableSubcommands?.map(sub => sub.name)
        const allSubcommandNames = this.subcommands?.map(sub => sub.name)
        if (!allSubcommandNames?.includes(subcommand))
            // prettier-ignore
            return message.sendErrorMessage(
                "specifyValidSub",
                humanizeArray(availableSubcommandNames? availableSubcommandNames: [])
            )

        const suggestionsID = client.config.suggestions[category]
        const suggestionsChannelRaw = await client.channels
            .fetch(suggestionsID, { force: true })
            .catch(() => null)
        if (
            !suggestionsChannelRaw ||
            !(suggestionsChannelRaw instanceof Discord.TextChannel)
        )
            return

        //TODO: Migrate to the new qna channels when they come out

        const suggestions: Discord.TextChannel | null = suggestionsChannelRaw

        if (subcommand === "search") {
            const PER_PAGE = 10
            await message.continue()

            const field = args.consumeIf(["title", "body", "teams"], "field") || "body"
            const query = args.consume("query")
            let statuses = args
                .consume("status")
                .split(/,? ?/)
                .map(s => s.toLowerCase())
            if (!statuses.length) statuses = Object.keys(SuggestionStatuses)
            const cleanQuery = Discord.escapeMarkdown(truncateString(query, 50))

            const queryBuilder = Suggestions?.createQueryBuilder("suggestion")
            const selection = queryBuilder
                ?.where(`INSTR(suggestion.${field}, :query)`, { query })
                ?.andWhere(`suggestion.staff = :staff`, { staff })
                .andWhere(
                    new typeorm.Brackets(query =>
                        query
                            .where(`suggestion.status IN(:statuses)`, { statuses })
                            .orWhere(`suggestion.status IS NULL`)
                    )
                )
                .orderBy("COALESCE(suggestion.number, suggestion.extends)", "DESC")
            const total = await selection?.getCount()
            const results = await selection?.take(PER_PAGE).getMany()

            if (!total) return message.sendErrorMessage("noSuggFound", cleanQuery)
            if (results === null || results === undefined)
                return message.sendErrorMessage("noSuggFound", cleanQuery)

            const paginate = total > PER_PAGE

            const embed = <Discord.APIEmbed>{
                color: hexToNum(client.config.colors.success),
                description: `Results found for **${cleanQuery}**:`,
                footer: {}
            }

            const formatResults = async (
                results: Suggestion[],
                embed: Discord.APIEmbed
            ) => {
                embed.fields = []
                for (const suggestion of results) {
                    const number = await suggestion.getIdentifier()
                    const url = suggestion.getURL(client)
                    embed.fields.push({
                        name: `#${number} — ${suggestion.title}`,
                        value: `[\\🔗](${url}) ${truncateString(suggestion.body, 128)}`
                    })
                }
            }

            await formatResults(results, embed)
            if (!paginate) return message.send({ embeds: [embed] })

            const pages = Math.ceil(total / PER_PAGE)
            if (embed.footer !== undefined)
                embed.footer.text = `${total} results total, page 1/${pages}`
            let row = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId(`${message.id}.forwards`)
                    .setLabel(client.config.emojis.right.toString())
                    .setStyle(Discord.ButtonStyle.Success)
            )
            const sentMessage = await message.send({
                embeds: [embed],
                components: [row]
            })

            let old = 1
            let page = 1

            const interactionFunc = async (interaction: Discord.Interaction) => {
                if (
                    !(
                        interaction.isButton() &&
                        [`${message.id}.back`, `${message.id}.forwards`].includes(
                            interaction.customId
                        )
                    )
                )
                    return
                if (interaction.user.id !== message.author.id)
                    return interaction.reply({
                        content: message.messages.wrongUser,
                        ephemeral: true
                    })
                if (
                    (interaction as Discord.ButtonInteraction).customId ===
                    `${message.id}.forwards`
                )
                    page += 1
                if (
                    (interaction as Discord.ButtonInteraction).customId ===
                    `${message.id}.back`
                )
                    page -= 1
                if (page === 1) {
                    row =
                        new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId(`${message.id}.forwards`)
                                .setLabel(client.config.emojis.right.toString())
                                .setStyle(Discord.ButtonStyle.Success)
                        )
                } else if (page === pages) {
                    row =
                        new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId(`${message.id}.back`)
                                .setLabel(client.config.emojis.left.toString())
                                .setStyle(Discord.ButtonStyle.Success)
                        )
                } else {
                    row = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()

                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId(`${message.id}.back`)
                                .setLabel(client.config.emojis.left.toString())
                                .setStyle(Discord.ButtonStyle.Success)
                        )
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId(`${message.id}.forwards`)
                                .setLabel(client.config.emojis.right.toString())
                                .setStyle(Discord.ButtonStyle.Success)
                        )
                }

                if (old === page) return
                old = page

                const results = await selection?.skip((page - 1) * PER_PAGE).getMany()
                if (results) await formatResults(results, embed)
                if (embed.footer !== undefined)
                    embed.footer.text = `${total} results total, page ${page}/${pages}`
                await (interaction as Discord.ButtonInteraction).update({
                    components: [row]
                })
                if (interaction.message instanceof Discord.Message) {
                    try {
                        await interaction.message.edit({ embeds: [embed] })
                    } catch {
                        interaction.editReply({ embeds: [embed] })
                    }
                } else interaction.editReply({ embeds: [embed] })
            }

            //@ts-ignore die
            client.on("interactionCreate", interactionFunc)

            setTimeout(async () => {
                await sentMessage.edit({ content: "Expired", components: [] })
                //@ts-ignore die
                client.off("interactionCreate", interactionFunc)
            }, 600000)

            return
        }

        /* suggestion management commands from here */

        const identifier = Suggestion.parseIdentifier(args.consume("number"))
        if (!identifier.number) return message.sendErrorMessage("noSuggestionNumber")

        if (subcommand != "edit") await message.continue()

        const suggestion = await Suggestion.findByIdentifier(identifier, staff)
        if (!suggestion) return message.sendErrorMessage("invalidSuggestionNumber")

        const suggestionMessage: Discord.Message | null = await suggestions.messages
            .fetch(suggestion.message)
            .catch(noop)
        if (!suggestionMessage) return message.sendErrorMessage("utlSuggestion")

        let thread: Discord.ThreadChannel | null = null

        if (suggestion.thread) {
            thread = await (
                client.channels.cache.get(
                    client.config.suggestions.discussion[category]
                ) as Discord.TextChannel
            ).threads.fetch(suggestion.thread)
            if ((thread as unknown as FetchedThreads).threads) thread = null
        }

        if (subcommand === "link") {
            const displayNumber = await suggestion.getIdentifier()
            const url = suggestionMessage.url
            if (suggestion.deletedAt) {
                return message.sendSuccessMessage(
                    "suggestionWasDeleted",
                    displayNumber,
                    url
                )
            } else {
                return message.sendSuccessMessage(
                    "suggestionLink",
                    displayNumber,
                    suggestion.title,
                    url
                )
            }
        } else if (subcommand === "edit") {
            if (suggestion.author !== message.author.id && !canManage)
                return message.sendErrorMessage("editOthers")

            const modalId = await message.showModal("suggestion", {
                title: suggestion.title,
                body: suggestion.body,
                teams: suggestion.teams
            })
            return client.interactionInfo.set(modalId, {
                suggestion: suggestion,
                message: suggestionMessage,
                modalType: "suggestionmodal"
            })
        } else if (subcommand === "delete") {
            if (suggestion.author !== message.author.id && !canManage)
                return message.sendErrorMessage("deleteOthers")

            // BaseEntity#softRemove() doesn't save the deletion date to the object itself
            // and we need it to be saved because Suggestion#displayEmbed() uses it
            suggestion.deleter = message.author.id
            suggestion.deletedAt = new Date()
            await suggestion.save()

            const embed = await suggestion.displayEmbed(client)
            await suggestionMessage.edit({ embeds: [embed] })
            if (thread) {
                await thread.setName(`${identifier.number} - deleted suggestion`)
                await thread.send("**This suggestion has been deleted.**")
                await thread.setLocked(true)
                await thread.setArchived(true)
            }

            message.sendSuccessMessage("deletedSuggestion")
        } else if (subcommand === "status") {
            if (!canManage) return

            const oldStatus = suggestion.status
            const status = args.consume("status").toLowerCase()
            const reason = args.consumeRest(["reason"])
            if (!(status in suggestionStatusActions)) {
                const formatted = humanizeArray(Object.keys(suggestionStatusActions))
                return message.sendErrorMessage("specifyNewStatus", formatted)
            }

            suggestion.status = status as SuggestionStatus
            suggestion.statusUpdater = message.author.id
            suggestion.statusReason = reason || undefined

            await suggestion.save()
            const embed = await suggestion.displayEmbed(client)
            await suggestionMessage.edit({ embeds: [embed] })

            if (thread?.locked && !thread?.archived) await thread.setLocked(false)

            const CLOSE_STATUS = ["approved", "denied", "duplicate", "invalid"]
            const OPEN_STATUS = ["forwarded", "in-progress", "information"]
            if (
                // prettier-ignore
                thread && (( // thread must stay outside parentheses
                    CLOSE_STATUS.includes(status) &&
                    !thread?.locked &&
                    !thread?.archived) ||
                (CLOSE_STATUS.includes(status) &&
                    status !== oldStatus))
            ) {
                await thread.send(
                    `**This suggestion has been marked as \`${status}\`**\nIf you feel this suggestion discussion must be reopened, contact a Suggestions Team member or a manager.`
                )
                await thread.setLocked(true)
                await thread.setArchived(true)
            } else if (
                OPEN_STATUS.includes(status) &&
                thread?.locked &&
                thread?.archived
            ) {
                await thread.send(
                    `**This suggestion has been marked as \`${status}\`**\nFor this reason, the suggestion discussion thread has been reopened.`
                )
                await thread.setLocked(false)
                await thread.setArchived(false)
            }

            if (status !== oldStatus) {
                const author: Discord.User | null = await client.users
                    .fetch(suggestion.author, { force: true })
                    .catch(noop)
                if (author) {
                    const dms = (await author.createDM()) as Discord.DMChannel
                    const updater = `<@${suggestion.statusUpdater}>`
                    // marked as something -> marked your suggestion as something
                    const actioned = suggestionStatusActions[status]
                        .toLowerCase()
                        .replace(/ed( |$)/, "ed your suggestion ")
                        .trim()
                    const number = await suggestion.getIdentifier()
                    const title = `[${suggestion.title}](${suggestion.getURL(client)})`
                    const cleanTitle = Discord.escapeMarkdown(title)

                    const update = `${updater} ${actioned}: **#${number} — ${cleanTitle}**.`
                    dms.send({
                        embeds: [
                            {
                                color: hexToNum(
                                    (
                                        client.config.colors.suggestions as Record<
                                            string,
                                            string
                                        >
                                    )[status]
                                ),
                                description: update
                            }
                        ]
                    }).catch(noop)
                }
            }

            if (
                !(
                    // prettier-ignore
                    thread && (( // thread must stay outside parentheses
                    CLOSE_STATUS.includes(status) &&
                    !thread?.locked &&
                    !thread?.archived) ||
                (CLOSE_STATUS.includes(status) &&
                    status !== oldStatus))
                )
            )
                return message.sendSuccessMessage("updatedSuggestion")
        }
    }
})
