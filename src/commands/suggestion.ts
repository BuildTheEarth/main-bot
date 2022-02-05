import Discord, { FetchedThreads } from "discord.js"
import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Suggestion, { SuggestionStatus, SuggestionStatuses } from "../entities/Suggestion"
import Roles from "../util/roles"
import path from "path"
import humanizeArray from "../util/humanizeArray"
import truncateString from "../util/truncateString"
import { loadSyncJSON5 } from "../util/loadJSON5"
import flattenMarkdown from "../util/flattenMarkdown"
import { Brackets } from "typeorm"
import noop from "../util/noop"
const suggestionStatusActions = loadSyncJSON5(
    path.join(__dirname + "../../../config/extensions/suggestionStatusActions.json5")
)
import hexToRGB from "../util/hexToRGB"
import GuildMember from "../struct/discord/GuildMember"
import CommandMessage from "../struct/CommandMessage"

export default new Command({
    name: "suggestion",
    aliases: ["suggestions"],
    description: "Manage suggestions.",
    permission: Roles.ANY,
    dms: true,
    subcommands: [
        {
            name: "link",
            description: "Link to a suggestion.",
            args: [
                {
                    name: "number",
                    description: "Suggestion number, only to be used if sub-suggesting.",
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
                    description: "Suggestion number, only to be used if sub-suggesting.",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "field",
                    description: "Field to edit.",
                    required: true,
                    optionType: "STRING",
                    choices: ["title", "body", "teams"]
                },
                {
                    name: "text",
                    description: "Edited text.",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "delete",
            description: "Delete a suggestion.",
            permission: Roles.ANY,
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
            permission: [Roles.SUGGESTION_TEAM, Roles.MANAGER],
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
            permission: Roles.ANY,
            seperator: "|",
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
        const Suggestions = client.db.getRepository(Suggestion)
        const staff = message.guild?.id === client.config.guilds.staff
        const category = staff ? "staff" : "main"
        const discussionID = client.config.suggestions.discussion[category]
        const canManage = message.member
            ? GuildMember.hasRole(
                  message.member,
                  [Roles.SUGGESTION_TEAM, Roles.MANAGER],
                  client
              )
            : false

        if (
            message.channel.id !== discussionID &&
            !canManage &&
            message.channel.type !== "DM"
        ) {
            const messages = await client.response.sendError(
                message,
                `Please run this command in <#${discussionID}>!`
            )
            if (message.channel.id === client.config.suggestions[category]) {
                message.delete().catch(noop)
                setTimeout(() => {
                    if (messages) messages.delete().catch(noop)
                }, 10000)
            }
            return
        }

        const subcommand = args.consumeSubcommand()
        const availableSubcommands = this.subcommands.filter(sub =>
            message.member
                ? GuildMember.hasRole(
                      message.member,
                      sub.permission || this.permission,
                      client
                  )
                : false
        )

        const availableSubcommandNames = availableSubcommands.map(sub => sub.name)
        const allSubcommandNames = this.subcommands.map(sub => sub.name)
        if (!allSubcommandNames.includes(subcommand))
            // prettier-ignore
            return client.response.sendError(message,
                `You must specify a subcommand! (${humanizeArray(availableSubcommandNames)}).`
            )

        const suggestionsID = client.config.suggestions[category]
        const suggestions: Discord.TextChannel = await client.channels
            .fetch(suggestionsID, { force: true })
            .catch(() => null)

        if (subcommand === "search") {
            const PER_PAGE = 10
            await message.continue()

            args.separator = "|"
            const field = args.consumeIf(["title", "body", "teams"], "field") || "body"
            const query = args.consume("query")
            let statuses = args
                .consume("status")
                .split(/,? ?/)
                .map(s => s.toLowerCase())
            if (!statuses.length) statuses = Object.keys(SuggestionStatuses)
            const cleanQuery = Discord.Util.escapeMarkdown(truncateString(query, 50))

            const queryBuilder = Suggestions.createQueryBuilder("suggestion")
            const selection = queryBuilder
                .where(`INSTR(suggestion.${field}, :query)`, { query })
                .andWhere(`suggestion.staff = :staff`, { staff })
                .andWhere(
                    new Brackets(query =>
                        query
                            .where(`suggestion.status IN(:statuses)`, { statuses })
                            .orWhere(`suggestion.status IS NULL`)
                    )
                )
                .orderBy("COALESCE(suggestion.number, suggestion.extends)", "DESC")
            const total = await selection.getCount()
            const results = await selection.take(PER_PAGE).getMany()
            const paginate = total > PER_PAGE

            if (!total)
                return client.response.sendError(
                    message,
                    `No suggestions found for **${cleanQuery}**!`
                )

            const embed: Discord.MessageEmbedOptions = {
                color: hexToRGB(client.config.colors.success),
                description: `Results found for **${cleanQuery}**:`,
                footer: {}
            }

            const formatResults = async (
                results: Suggestion[],
                embed: Discord.MessageEmbedOptions
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
            embed.footer.text = `${total} results total, page 1/${pages}`
            let row = new Discord.MessageActionRow().addComponents(
                new Discord.MessageButton()
                    .setCustomId(`${message.id}.forwards`)
                    .setLabel(client.config.emojis.right.toString())
                    .setStyle("SUCCESS")
            )
            const sentMessage = await message.send({
                embeds: [embed],
                components: [row]
            })

            let old = 1
            let page = 1

            const interactionFunc = async interaction => {
                if (
                    !(
                        interaction.isButton() &&
                        [`${message.id}.back`, `${message.id}.forwards`].includes(
                            interaction.customId
                        )
                    )
                )
                    return
                if (interaction.user.id !== message.member.id)
                    return interaction.reply({
                        content: client.messages.wrongUser,
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
                    row = new Discord.MessageActionRow().addComponents(
                        new Discord.MessageButton()
                            .setCustomId(`${message.id}.forwards`)
                            .setLabel(client.config.emojis.right.toString())
                            .setStyle("SUCCESS")
                    )
                } else if (page === pages) {
                    row = new Discord.MessageActionRow().addComponents(
                        new Discord.MessageButton()
                            .setCustomId(`${message.id}.back`)
                            .setLabel(client.config.emojis.left.toString())
                            .setStyle("SUCCESS")
                    )
                } else {
                    row = new Discord.MessageActionRow()

                        .addComponents(
                            new Discord.MessageButton()
                                .setCustomId(`${message.id}.back`)
                                .setLabel(client.config.emojis.left.toString())
                                .setStyle("SUCCESS")
                        )
                        .addComponents(
                            new Discord.MessageButton()
                                .setCustomId(`${message.id}.forwards`)
                                .setLabel(client.config.emojis.right.toString())
                                .setStyle("SUCCESS")
                        )
                }

                if (old === page) return
                old = page

                const results = await selection.skip((page - 1) * PER_PAGE).getMany()
                await formatResults(results, embed)
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

            client.on("interactionCreate", interactionFunc)

            setTimeout(async () => {
                await sentMessage.edit({ content: "Expired", components: [] })
                client.off("interactionCreate", interactionFunc)
            }, 600000)

            return
        }

        /* suggestion management commands from here */

        const identifier = Suggestion.parseIdentifier(args.consume("number"))
        if (!identifier.number)
            return client.response.sendError(message, client.messages.noSuggestionNumber)

        await message.continue()

        const suggestion = await Suggestion.findByIdentifier(identifier, staff)
        if (!suggestion)
            return client.response.sendError(
                message,
                client.messages.invalidSuggestionNumber
            )

        const suggestionMessage: Discord.Message = await suggestions.messages
            .fetch(suggestion.message)
            .catch(() => null)
        if (!suggestionMessage)
            return client.response.sendError(message, client.messages.utlSuggestion)

        let thread = await (
            client.channels.cache.get(discussionID) as Discord.TextChannel
        ).threads.fetch(suggestion.thread)
        if ((thread as unknown as FetchedThreads).threads) thread = null

        if (subcommand === "link") {
            const displayNumber = await suggestion.getIdentifier()
            const url = suggestionMessage.url
            if (suggestion.deletedAt) {
                return client.response.sendSuccess(
                    message,
                    `Looks like suggestion **#${displayNumber}** was deleted, but here it is: [*Deleted*](${url})`
                )
            } else {
                return client.response.sendSuccess(
                    message,
                    `Here's the link to suggestion **#${displayNumber}**: [${suggestion.title}](${url})`
                )
            }
        } else if (subcommand === "edit") {
            const field = args.consumeIf(["title", "body", "teams"], "field") || "body"
            if (
                suggestion.author !== message.member.id &&
                (field === "body" || !canManage)
            )
                return client.response.sendError(message, client.messages.editOthers)

            let edited = args.consumeRest(["text"])
            if (field === "title")
                edited = await flattenMarkdown(edited, client, message.guild)
            if (field === "title" && edited.length > 200)
                return client.response.sendError(message, client.messages.titleTooLong200)
            if (field === "teams" && edited.length > 255)
                return client.response.sendError(message, client.messages.teamsTooLong255)
            if (!edited) return client.response.sendError(message, client.messages.noBody)

            suggestion[field] = edited
            await suggestion.save()

            const embed = await suggestion.displayEmbed(client)
            await suggestionMessage.edit({ embeds: [embed] })
            return client.response.sendSuccess(message, "Edited the suggestion!")
        } else if (subcommand === "delete") {
            if (suggestion.author !== message.member.id && !canManage)
                return client.response.sendError(message, client.messages.deleteOthers)

            // BaseEntity#softRemove() doesn't save the deletion date to the object itself
            // and we need it to be saved because Suggestion#displayEmbed() uses it
            suggestion.deleter = message.member.id
            suggestion.deletedAt = new Date()
            await suggestion.save()

            const embed = await suggestion.displayEmbed(client)
            await suggestionMessage.edit({ embeds: [embed] })
            if (thread) {
                await thread.setName(`${identifier} - deleted suggestion`)
                await thread.send("**This suggestion has been deleted.**")
                await thread.setLocked(true)
                await thread.setArchived(true)
            }

            client.response.sendSuccess(message, "Deleted the suggestion!")
        } else if (subcommand === "status") {
            if (!canManage) return

            const oldStatus = suggestion.status
            const status = args.consume("status").toLowerCase()
            const reason = args.consumeRest(["reason"])
            if (!(status in suggestionStatusActions)) {
                const formatted = humanizeArray(Object.keys(suggestionStatusActions))
                return client.response.sendError(
                    message,
                    `You must specify a new suggestion status! (${formatted}).`
                )
            }

            suggestion.status = status as SuggestionStatus
            suggestion.statusUpdater = message.member.id
            suggestion.statusReason = reason || null

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
                const author: Discord.User = await client.users
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
                    const cleanTitle = Discord.Util.escapeMarkdown(title)

                    const update = `${updater} ${actioned}: **#${number} — ${cleanTitle}**.`
                    dms.send({
                        embeds: [
                            {
                                color: client.config.colors.suggestions[status],
                                description: update
                            }
                        ]
                    }).catch(noop)
                }
            }

            return client.response.sendSuccess(message, "Updated the suggestion!")
        }
    }
})
