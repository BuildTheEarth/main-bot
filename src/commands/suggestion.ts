import Discord from "discord.js"
import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import TextChannel from "../struct/discord/TextChannel"
import Suggestion, { SuggestionStatuses } from "../entities/Suggestion"
import Roles from "../util/roles"
import humanizeArray from "../util/humanizeArray"
import truncateString from "../util/truncateString"
import { Brackets } from "typeorm"

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
    async run(this: Command, client: Client, message: Message, args: Args) {
        const Suggestions = client.db.getRepository(Suggestion)
        const staff = message.guild?.id === client.config.guilds.staff
        const category = staff ? "staff" : "main"
        const discussionID = client.config.suggestions.discussion[category]
        const canManage = message.member
            ? message.member.hasStaffPermission([Roles.SUGGESTION_TEAM, Roles.MANAGER])
            : false

        if (
            message.channel.id !== discussionID &&
            !canManage &&
            message.channel.type !== "dm"
        ) {
            const errorMessage = await message.channel.sendError(
                `Please run this command in <#${discussionID}>!`
            )
            if (message.channel.id === client.config.suggestions[category]) {
                await message.delete()
                await errorMessage.delete({ timeout: 10000 })
            }
            return
        }

        const subcommand = args.consume()
        const availableSubcommands = this.subcommands.filter(sub =>
            message.member
                ? message.member.hasStaffPermission(sub.permission || this.permission)
                : false
        )

        const availableSubcommandNames = availableSubcommands.map(sub => sub.name)
        const allSubcommandNames = this.subcommands.map(sub => sub.name)
        if (!allSubcommandNames.includes(subcommand))
            // prettier-ignore
            return message.channel.sendError(
                `You must specify a subcommand! (${humanizeArray(availableSubcommandNames)}).`
            )

        const suggestionsID = client.config.suggestions[category]
        const suggestions: TextChannel = await client.channels
            .fetch(suggestionsID, true)
            .catch(() => null)

        if (subcommand === "search") {
            args.separator = "|"
            const field = args.consumeIf(["title", "body", "teams"]) || "body"
            const query = args.consume()
            let statuses = args
                .consume()
                .split(/,? ?/)
                .map(s => s.toLowerCase())
            if (!statuses.length) statuses = Object.keys(SuggestionStatuses)
            const cleanQuery = Discord.Util.escapeMarkdown(truncateString(query, 50))

            const results = await Suggestions.createQueryBuilder("suggestion")
                .where(`INSTR(suggestion.${field}, :query)`, { query })
                .andWhere(
                    new Brackets(query =>
                        query
                            .where(`suggestion.status IN(:statuses)`, { statuses })
                            .orWhere(`suggestion.status IS NULL`)
                    )
                )
                .take(25)
                .orderBy("COALESCE(suggestion.number, suggestion.extends)", "DESC")
                .getMany()

            if (!results.length)
                return message.channel.sendError(
                    `No suggestions found for **${cleanQuery}**!`
                )

            const embed: Discord.MessageEmbedOptions = {
                color: client.config.colors.success,
                description: `Results found for **${cleanQuery}**:`,
                fields: []
            }

            for (const suggestion of results) {
                const url = suggestion.getURL(client)
                embed.fields.push({
                    name: `#${await suggestion.getDisplayNumber()} — ${suggestion.title}`,
                    value: `[\\🔗](${url}) ${truncateString(suggestion.body, 128)}`
                })
            }

            return message.channel.send({ embed })
        }

        /* suggestion management commands from here */

        const number = Number(args.consume().match(/\d+/)?.[0])
        if (Number.isNaN(number))
            return message.channel.sendError("You must specify a suggestion number!")

        const suggestion = await Suggestion.findOne({ number, staff })
        if (!suggestion)
            return message.channel.sendError("Hmm... That suggestion doesn't exist.")

        const suggestionMessage: Message = await suggestions.messages
            .fetch(suggestion.message)
            .catch(() => null)
        if (!suggestionMessage)
            return message.channel.sendError("Can't find the suggestion's message!")

        if (subcommand === "link") {
            const displayNumber = await suggestion.getDisplayNumber()
            const url = suggestionMessage.url
            if (suggestion.deletedAt) {
                return message.channel.sendSuccess(
                    `Looks like suggestion **#${displayNumber}** was deleted, but here it is: [*Deleted*](${url})`
                )
            } else {
                return message.channel.sendSuccess(
                    `Here's the link to suggestion **#${displayNumber}**: [${suggestion.title}](${url})`
                )
            }
        } else if (subcommand === "edit") {
            const field = args.consumeIf(["title", "body", "teams"]) || "body"
            if (
                suggestion.author !== message.author.id &&
                (field === "body" || !canManage)
            )
                return message.channel.sendError(
                    "You can't edit other people's suggestions!"
                )

            const edited = args.consumeRest()
            if (field === "title" && edited.length > 99)
                return message.channel.sendError("That title is too long!")
            if (field === "teams" && edited.length > 255)
                return message.channel.sendError("That team is too long!")

            suggestion[field] = edited
            await suggestion.save()

            const embed = await suggestion.displayEmbed(client)
            await suggestionMessage.edit({ embed })
            return message.channel.sendSuccess("Edited the suggestion!")
        } else if (subcommand === "delete") {
            if (suggestion.author !== message.author.id && !canManage)
                return message.channel.sendError(
                    "You can't delete other people's suggestions!"
                )

            // BaseEntity#softRemove() doesn't save the deletion date to the object itself
            // and we need it to be saved because Suggestion#displayEmbed() uses it
            suggestion.deleter = message.author.id
            suggestion.deletedAt = new Date()
            await suggestion.save()

            const embed = await suggestion.displayEmbed(client)
            await suggestionMessage.edit({ embed })

            message.channel.sendSuccess("Deleted the suggestion!")
        } else if (subcommand === "status") {
            if (!canManage) return

            const status = args.consume().toLowerCase()
            const reason = args.consumeRest()
            if (!(status in SuggestionStatuses)) {
                const formatted = humanizeArray(Object.keys(SuggestionStatuses))
                return message.channel.sendError(
                    `You must specify a new suggestion status! (${formatted}).`
                )
            }

            suggestion.status = status as keyof typeof SuggestionStatuses
            suggestion.statusUpdater = message.author.id
            suggestion.statusReason = reason || null

            await suggestion.save()
            const embed = await suggestion.displayEmbed(client)
            await suggestionMessage.edit({ embed })

            return message.channel.sendSuccess("Updated the suggestion!")
        }
    }
})
