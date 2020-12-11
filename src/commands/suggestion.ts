import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import TextChannel from "../struct/discord/TextChannel"
import Suggestion from "../entities/Suggestion"
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
            usage: "<number> ['title'] <text>"
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
        const suggestionsChannelID = client.config.suggestions[staff ? "staff" : "main"]
        const suggestionsChannel = <TextChannel>(
            await client.channels.fetch(suggestionsChannelID, true)
        )

        const number = Number(args.consume().match(/\d+/)?.[0])
        if (Number.isNaN(number))
            return message.channel.sendError("You must specify a suggestion number!")

        const suggestion = await Suggestion.findOne({ where: { number, staff } })
        if (!suggestion)
            return message.channel.sendError("Hmm... That suggestion doesn't exist.")
        const displayNumber = await suggestion.getDisplayNumber()

        if (subcommand === "link") {
            const url = `https://discord.com/channels/${message.guild.id}/${suggestionsChannelID}/${suggestion.message}`
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
            if (suggestion.author !== message.author.id)
                return message.channel.sendError(
                    "You can't edit other people's suggestions!"
                )
            const title = !!args.consumeIf(arg => arg.toLowerCase() === "title")
            const edited = args.consumeRest()
            if (title && edited.length > 99)
                return message.channel.sendError("That title is too long!")

            suggestion[title ? "title" : "body"] = edited
            await suggestion.save()
            const embed = await suggestion.displayEmbed(message.author)
            // prettier-ignore
            const suggestionMessage = await suggestionsChannel.messages.fetch(suggestion.message, true)
            if (!suggestionMessage)
                return message.channel.sendError("I can't find the suggestion's message!")
            await suggestionMessage.edit({ embed })

            const possessive = title ? "'s title" : ""
            return message.channel.sendSuccess(`Edited your suggestion${possessive}!`)
        }
    }
})
