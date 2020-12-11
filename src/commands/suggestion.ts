import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
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
        const suggestionsChannel = client.config.suggestions[staff ? "staff" : "main"]
        if (subcommand === "link") {
            const number = Number(args.consume().match(/\d+/)?.[0])
            if (Number.isNaN(number))
                return message.channel.sendError("You must specify a suggestion number!")

            const suggestion = await Suggestion.findOne({ where: { number, staff } })
            if (!suggestion)
                return message.channel.sendError("Hmm... That suggestion doesn't exist.")
            const displayNumber = await suggestion.getDisplayNumber()

            const url = `https://discord.com/channels/${message.guild.id}/${suggestionsChannel}/${suggestion.message}`
            if (suggestion.deletedAt) {
                return message.channel.sendSuccess(
                    `Looks like suggestion **#${displayNumber}** was deleted, but here it is: [*Deleted*](${url})`
                )
            } else {
                return message.channel.sendSuccess(
                    `Here's the link to suggestion **#${displayNumber}**: [${suggestion.title}](${url})`
                )
            }
        }
    }
})
