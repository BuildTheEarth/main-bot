import Discord from "discord.js"
import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Suggestion, { SuggestionStatus, SuggestionStatuses } from "../entities/Suggestion"
import Roles from "../util/roles"
import humanizeArray from "../util/humanizeArray"
import truncateString from "../util/truncateString"
import flattenMarkdown from "../util/flattenMarkdown"
import { Brackets } from "typeorm"
import noop from "../util/noop"
import suggestionStatusActions from "../data/suggestionStatusActions"
import hexToRGB from "../util/hexToRGB"
import GuildMember from "../struct/discord/GuildMember"

export default new Command({
    name: "suggestion",
    aliases: ["suggestions"],
    description: "Manage suggestions.",
    permission: Roles.ANY,
    usage: "",
    dms: true,
    subcommands: [
        {
            name: "link",
            description: "Link to a suggestion.",
            usage: "<number>"
        },
        {
            name: "edit",
            description: "Edit a suggestion.",
            usage: "<number> ['title' | 'body' | 'teams'] <text>"
        },
        {
            name: "delete",
            description: "Delete a suggestion.",
            permission: Roles.ANY,
            usage: "<number>"
        },
        {
            name: "status",
            description: "Change the status of a suggestion.",
            permission: [Roles.SUGGESTION_TEAM, Roles.MANAGER],
            usage: "<number> <status> [reason]"
        },
        {
            name: "search",
            description: "Search for suggestions.",
            permission: Roles.ANY,
            usage: "['title' | 'body' | 'teams'] | <query> | [status/es]"
        }
    ],
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const Suggestions = client.db.getRepository(Suggestion)
        const staff = message.guild?.id === client.config.guilds.staff
        const category = staff ? "staff" : "main"
        const discussionID = client.config.suggestions.discussion[category]
        const canManage = message.member
            ? GuildMember.hasRole(message.member, [Roles.SUGGESTION_TEAM, Roles.MANAGER])
            : false

        if (
            message.channel.id !== discussionID &&
            !canManage &&
            message.channel.type !== "DM"
        ) {
            const errorMessage = await client.channel.sendError(
                message.channel,
                `Please run this command in <#${discussionID}>!`
            )
            if (message.channel.id === client.config.suggestions[category]) {
                message.delete().catch(noop)
                setTimeout(() => errorMessage.delete().catch(noop), 10000)
            }
            return
        }

        const subcommand = args.consume()
        const availableSubcommands = this.subcommands.filter(sub =>
            message.member
                ? GuildMember.hasRole(message.member, sub.permission || this.permission)
                : false
        )

        const availableSubcommandNames = availableSubcommands.map(sub => sub.name)
        const allSubcommandNames = this.subcommands.map(sub => sub.name)
        if (!allSubcommandNames.includes(subcommand))
            // prettier-ignore
            return client.channel.sendError(message.channel,
                `You must specify a subcommand! (${humanizeArray(availableSubcommandNames)}).`
            )

        const suggestionsID = client.config.suggestions[category]
<<<<<<< HEAD
        const suggestions: Discord.TextChannel = await client.channels
            .fetch(suggestionsID, { force: true })
            .catch(() => null)

        if (subcommand === "search") {
            const PER_PAGE = 10

            args.separator = "|"
            const field = args.consumeIf(["title", "body", "teams"]) || "body"
            const query = args.consume()
            let statuses = args
                .consume()
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
                return client.channel.sendError(
                    message.channel,
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
            if (!paginate) return message.channel.send({ embeds: [embed] })

            const pages = Math.ceil(total / PER_PAGE)
            embed.footer.text = `${total} results total, page 1/${pages}`
            const resultsMessage = await message.channel.send({ embeds: [embed] })

            const { emojis } = client.config
            await resultsMessage.react(emojis.left)
            await resultsMessage.react(emojis.right)

            const filter = (reaction: Discord.MessageReaction) =>
                [emojis.left, emojis.right].includes(reaction.emoji.name)
            const reactions = resultsMessage.createReactionCollector({ filter: filter })

            let old = 1
            let page = 1
            reactions.on("collect", async (reaction, user) => {
                if (reaction.emoji.name === emojis.left && page > 1) page--
                if (reaction.emoji.name === emojis.right && page < pages) page++
                await reaction.users.remove(user)

                if (old === page) return
                old = page

                const results = await selection.skip((page - 1) * PER_PAGE).getMany()
                await formatResults(results, embed)
                embed.footer.text = `${total} results total, page ${page}/${pages}`
                await resultsMessage.edit({ embeds: [embed] })
            })

            return
        }

        /* suggestion management commands from here */

        const identifier = Suggestion.parseIdentifier(args.consume())
        if (!identifier.number)
            return client.channel.sendError(
                message.channel,
                "You must specify a suggestion number!"
            )

        const suggestion = await Suggestion.findByIdentifier(identifier, staff)
        if (!suggestion)
            return client.channel.sendError(
                message.channel,
                "Hmm... That suggestion doesn't exist."
            )

        const suggestionMessage: Discord.Message = await suggestions.messages
            .fetch(suggestion.message)
            .catch(() => null)
        if (!suggestionMessage)
            return client.channel.sendError(
                message.channel,
                "Can't find the suggestion's message!"
            )

        if (subcommand === "link") {
            const displayNumber = await suggestion.getIdentifier()
            const url = suggestionMessage.url
            if (suggestion.deletedAt) {
                return client.channel.sendSuccess(
                    message.channel,
                    `Looks like suggestion **#${displayNumber}** was deleted, but here it is: [*Deleted*](${url})`
                )
            } else {
                return client.channel.sendSuccess(
                    message.channel,
                    `Here's the link to suggestion **#${displayNumber}**: [${suggestion.title}](${url})`
                )
            }
        } else if (subcommand === "edit") {
            const field = args.consumeIf(["title", "body", "teams"]) || "body"
            if (
                suggestion.author !== message.author.id &&
                (field === "body" || !canManage)
            )
                return client.channel.sendError(
                    message.channel,
                    "You can't edit other people's suggestions!"
                )

            let edited = args.consumeRest()
            if (field === "title") edited = flattenMarkdown(edited, client, message.guild)
            if (field === "title" && edited.length > 200)
                return client.channel.sendError(
                    message.channel,
                    "That title is too long! (max. 200 characters)."
                )
            if (field === "teams" && edited.length > 255)
                return client.channel.sendError(
                    message.channel,
                    "That team is too long! (max. 255 characters)."
                )
            if (!edited)
                return client.channel.sendError(
                    message.channel,
                    "You must provide a new field body!"
                )

            suggestion[field] = edited
            await suggestion.save()

            const embed = await suggestion.displayEmbed(client)
            await suggestionMessage.edit({ embeds: [embed] })
            return client.channel.sendSuccess(message.channel, "Edited the suggestion!")
        } else if (subcommand === "delete") {
            if (suggestion.author !== message.author.id && !canManage)
                return client.channel.sendError(
                    message.channel,
                    "You can't delete other people's suggestions!"
                )

            // BaseEntity#softRemove() doesn't save the deletion date to the object itself
            // and we need it to be saved because Suggestion#displayEmbed() uses it
            suggestion.deleter = message.author.id
            suggestion.deletedAt = new Date()
            await suggestion.save()

            const embed = await suggestion.displayEmbed(client)
            await suggestionMessage.edit({ embeds: [embed] })

            client.channel.sendSuccess(message.channel, "Deleted the suggestion!")
        } else if (subcommand === "status") {
            if (!canManage) return

            const oldStatus = suggestion.status
            const status = args.consume().toLowerCase()
            const reason = args.consumeRest()
            if (!(status in suggestionStatusActions)) {
                const formatted = humanizeArray(Object.keys(suggestionStatusActions))
                return client.channel.sendError(
                    message.channel,
                    `You must specify a new suggestion status! (${formatted}).`
                )
            }

            suggestion.status = status as SuggestionStatus
            suggestion.statusUpdater = message.author.id
            suggestion.statusReason = reason || null

            await suggestion.save()
            const embed = await suggestion.displayEmbed(client)
            await suggestionMessage.edit({ embeds: [embed] })

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

            return client.channel.sendSuccess(message.channel, "Updated the suggestion!")
        }
=======
        const suggestions = client.channels.cache.get(
            suggestionsID
        ) as Discord.TextChannel

        const embed = await suggestion.displayEmbed(client)
        const suggestionMessage = await suggestions.send({ embeds: [embed] })
        suggestion.message = suggestionMessage.id
        await suggestion.save()

        await suggestionMessage.react(client.config.emojis.upvote)
        await suggestionMessage.react(client.config.emojis.downvote)
        if (!anon && message.channel.type !== "DM")
            await message.delete().catch(() => null)
<<<<<<< HEAD
>>>>>>> parent of f622a5d... Add auto-thread creation for suggestions
=======
>>>>>>> parent of f622a5d... Add auto-thread creation for suggestions
    }
})
