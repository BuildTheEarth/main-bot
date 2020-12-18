import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Suggestion from "../entities/Suggestion"
import Roles from "../util/roles"
import TextChannel from "../struct/discord/TextChannel"

const EXTENSION_REGEX = /^(?:\*?\*?#?)(\d{1,10}) *(?:[a-z])(?::?\*?\*?:? *)/i

export default new Command({
    name: "suggest",
    aliases: [],
    description: "Make a suggestion.",
    permission: Roles.ANY,
    usage: "['anon'] <title> | <body> | [team/s]",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const anon = !!args.consumeIf(["anon", "anonymous"])
        const staff = message.guild?.id === client.config.guilds.staff

        const suggestionsChannel = client.config.suggestions[staff ? "staff" : "main"]
        if (message.channel?.id !== suggestionsChannel && message.channel.type !== "dm")
            return message.channel.sendError(
                `Please run this command in <#${suggestionsChannel}>!`
            )

        args.separator = "|"
        const [title, body, teams] = args.consume(3)

        let error: string
        const extend = title.match(EXTENSION_REGEX)?.[1]
        if (extend) {
            const criterion = { where: { number: Number(extend) } }
            const extendSuggestion = await Suggestion.findOne(criterion)
            if (!extendSuggestion)
                error = `The suggestion you're trying to extend (**#${extend}**) doesn't exist!`
        }

        if (!title) error = "You must specify a title!"
        if (title.length > 99) error = "That title is too long!"
        if (!body) error = "You must specify a suggestion body!"

        if (error) {
            if (message.channel.type !== "dm") await message.delete()
            const errorMessage = await message.channel.sendError(error)
            return await errorMessage.delete({ timeout: 10000 })
        }

        // delete message asap if suggestion is anonymous
        if (anon && message.channel.type !== "dm") await message.delete()
        else message.react("👌")

        const suggestion = new Suggestion()
        if (!extend) suggestion.number = await Suggestion.findNumber(staff)
        else suggestion.extends = Number(extend)
        suggestion.author = message.author.id
        suggestion.anonymous = anon
        suggestion.title = title.replace(EXTENSION_REGEX, "")
        suggestion.body = body
        suggestion.teams = teams || null
        suggestion.staff = staff

        const category = staff ? "staff" : "main"
        const suggestionsID = client.config.suggestions[category]
        const suggestions = <TextChannel>await client.channels.fetch(suggestionsID, true)

        const embed = await suggestion.displayEmbed(client)
        const suggestionMessage = await suggestions.send({ embed })
        suggestion.message = suggestionMessage.id
        await suggestion.save()

        await suggestionMessage.react(client.config.emojis.upvote)
        await suggestionMessage.react(client.config.emojis.downvote)
        if (!anon && message.channel.type !== "dm") await message.delete()
    }
})
