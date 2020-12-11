import Discord from "discord.js"
import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Suggestion from "../entities/Suggestion"
import Roles from "../util/roles"

export default new Command({
    name: "suggest",
    aliases: [],
    description: "Make a suggestion.",
    permission: Roles.ANY,
    usage: "[anon] <title> | <body> | [team/s]",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const anon = args.consumeIf(a => ["anon", "anonymous"].includes(a.toLowerCase()))
        const staff = message.guild.id === client.config.guilds.main
        const suggestionsChannel = client.config.suggestions[staff ? "staff" : "main"]
        if (message.channel.id !== suggestionsChannel)
            return message.channel.sendError(
                `Please run this command in <#${suggestionsChannel}>!`
            )

        args.separator = "|"
        const [title, body, teams] = args.consume(3)
        if (!title) return message.channel.sendError("You must specify a title!")
        if (title.length > 99) return message.channel.sendError("That title is too long!")
        if (!body) return message.channel.sendError("You must specify a suggestion body!")
        await message.react("👌")

        const suggestion = new Suggestion()
        suggestion.number = await Suggestion.findNumber(staff)
        suggestion.author = message.author.id
        suggestion.anonymous = Boolean(anon)
        suggestion.title = title
        suggestion.body = body
        suggestion.teams = teams || null
        suggestion.staff = staff

        const displayNumber = await suggestion.getDisplayNumber()
        const embed: Discord.MessageEmbedOptions = {
            color: "#999999",
            author: { name: `#${displayNumber} — ${title}` },
            description: body,
            fields: []
        }

        if (!suggestion.anonymous) {
            embed.fields.push({ name: "Author", value: `<@${suggestion.author}>` })
            embed.thumbnail = {
                url: message.author.displayAvatarURL({
                    size: 128,
                    format: "png",
                    dynamic: true
                })
            }
        }
        if (suggestion.teams) {
            embed.fields.push({ name: "Team/s", value: suggestion.teams })
        }

        const suggestionMessage = await message.channel.send({ embed })
        suggestion.message = suggestionMessage.id
        await suggestion.save()

        await suggestionMessage.react("👍")
        await suggestionMessage.react("👎")
        await message.delete()
    }
})
