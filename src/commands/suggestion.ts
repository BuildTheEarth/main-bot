import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import TextChannel from "../struct/discord/TextChannel"
import Suggestion, { SuggestionStatuses } from "../entities/Suggestion"
import Roles from "../util/roles"

export default new Command({
    name: "suggestion",
    aliases: [],
    description: "Manage suggestions.",
    permission: Roles.ANY,
    usage: "",
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
        }
    ],
    async run(this: Command, client: Client, message: Message, args: Args) {
        const subcommand = args.consume()
        const availableSubcommands = this.subcommands.filter(sub =>
            message.member.hasStaffPermission(sub.permission || this.permission)
        )

        const availableSubcommandNames = availableSubcommands.map(sub => sub.name)
        const allSubcommandNames = this.subcommands.map(sub => sub.name)
        if (!allSubcommandNames.includes(subcommand))
            // prettier-ignore
            return message.channel.sendError(
                `You must specify a subcommand (\`${availableSubcommandNames.join("`, `")}\`).`
            )

        const staff = message.guild.id === client.config.guilds.staff
        const suggestionsID = client.config.suggestions[staff ? "staff" : "main"]
        const suggestions = <TextChannel>await client.channels.fetch(suggestionsID, true)

        const number = Number(args.consume().match(/\d+/)?.[0])
        if (Number.isNaN(number))
            return message.channel.sendError("You must specify a suggestion number!")

        const suggestion = await Suggestion.findOne({ where: { number, staff } })
        if (!suggestion)
            return message.channel.sendError("Hmm... That suggestion doesn't exist.")

        const suggestionMessage = await suggestions.messages.fetch(suggestion.message)
        if (!suggestionMessage)
            return message.channel.sendError("Can't find the suggestion's message!")

        const canManage = message.member.hasStaffPermission([
            Roles.SUGGESTION_TEAM,
            Roles.MANAGER
        ])

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
            // prettier-ignore
            if (suggestion.author !== message.author.id)
                return message.channel.sendError("You can't edit other people's suggestions!")

            const field = args.consumeIf(["title", "body", "teams"]) || "body"
            const edited = args.consumeRest()
            if (field === "title" && edited.length > 99)
                return message.channel.sendError("That title is too long!")
            if (field === "teams" && edited.length > 255)
                return message.channel.sendError("That team is too long!")

            suggestion[field] = edited
            await suggestion.save()

            const embed = await suggestion.displayEmbed(client)
            await suggestionMessage.edit({ embed })
            return message.channel.sendSuccess("Edited your suggestion!")
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
                const formatted = Object.keys(SuggestionStatuses).join("`, `")
                return message.channel.sendError(
                    `You must specify a new suggestion status! (\`${formatted}\`).`
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
