import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Suggestion from "../entities/Suggestion"
import TextChannel from "../struct/discord/TextChannel"
import Roles from "../util/roles"
import flattenMarkdown from "../util/flattenMarkdown"

export default new Command({
    name: "suggest",
    aliases: [],
    description: "Make a suggestion.",
    permission: Roles.ANY,
    usage: "['anon'] <title> | <body> | [team/s]",
    dms: true,
    async run(this: Command, client: Client, message: Message, args: Args) {
        const anon = !!args.consumeIf(["anon", "anonymous"])
        const staff = message.guild?.id === client.config.guilds.staff

        const suggestionsChannel = client.config.suggestions[staff ? "staff" : "main"]
        if (message.channel?.id !== suggestionsChannel && message.channel.type !== "dm")
            return message.channel.sendError(
                `Please run this command in <#${suggestionsChannel}>!`
            )

        const identifier = args.consumeIf(Suggestion.isIdentifier)
        const extend = identifier && Suggestion.parseIdentifier(identifier)
        args.separator = "|"
        const title = flattenMarkdown(args.consume(), client, message.guild)
        const [body, teams] = args.consume(2)

        let error: string
        if (extend && !(await Suggestion.findOne({ number: extend.number })))
            error = `The suggestion you're trying to extend (**#${extend}**) doesn't exist!`
        if (!body) error = "You must specify a suggestion body!"
        if (!title) error = "You must specify a title!"
        if (title?.length > 200) error = "That title is too long! (max. 200 characters)."

        if (error) {
            if (message.channel.type !== "dm") await message.delete().catch(() => null)
            const errorMessage = await message.channel.sendError(error)
            return await errorMessage.delete({ timeout: 10000 }).catch(() => null)
        }

        // delete message asap if suggestion is anonymous
        if (anon && message.channel.type !== "dm")
            await message.delete().catch(() => null)
        else message.react("👌")

        const suggestion = new Suggestion()
        if (extend?.number) suggestion.extends = extend.number
        else suggestion.number = await Suggestion.findNumber(staff, client)
        suggestion.author = message.author.id
        suggestion.anonymous = anon
        suggestion.title = title
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
        if (!anon && message.channel.type !== "dm")
            await message.delete().catch(() => null)
    }
})
