import Discord from "discord.js"
import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import Suggestion from "../entities/Suggestion.entity.js"
import Roles from "../util/roles.util.js"
import CommandMessage from "../struct/CommandMessage.js"
import { flattenMarkdown } from "@buildtheearth/bot-utils"

export default new Command({
    name: "suggest",
    aliases: [],
    description: "Make a suggestion.",
    permission: Roles.ANY,
    seperator: " | ",
    args: [
        {
            name: "anon",
            description: "Wheter the suggestion is anonymous or not.",
            required: false,
            optionType: "STRING",
            choices: ["anon"]
        },
        {
            name: "number",
            description: "Suggestion number, only to be used if sub-suggesting.",
            required: false,
            optionType: "STRING"
        },
        {
            name: "title",
            description: "Suggestion title",
            required: true,
            optionType: "STRING"
        },
        {
            name: "body",
            description: "Suggestion body",
            required: true,
            optionType: "STRING"
        },
        {
            name: "team",
            description: "Suggestion team/s",
            required: false,
            optionType: "STRING"
        }
    ],
    dms: true,
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const anon = !!args.consumeIf(["anon", "anonymous"], "anon")
        const staff = message.guild?.id === client.config.guilds.staff

        const suggestionsChannel = client.config.suggestions[staff ? "staff" : "main"]
        if (message.channel?.id !== suggestionsChannel && message.channel.type !== "DM")
            return client.response.sendError(
                message,
                `Please run this command in <#${suggestionsChannel}>!`
            )

        const identifier = args.consumeIf(Suggestion.isIdentifier, "number")
        const extend = identifier && Suggestion.parseIdentifier(identifier)
        args.separator = "|"
        const title = await flattenMarkdown(args.consume("title"), message.guild)
        const [body, teams] = [args.consume("body"), args.consume("team")]

        await message.continue()

        let error: string
        if (extend && !(await Suggestion.findOne({ number: extend.number })))
            error = `The suggestion you're trying to extend (**#${extend}**) doesn't exist!`
        if (!body) error = client.messages.noBody
        if (!title) error = client.messages.noTitle
        if (title?.length > 200) error = client.messages.titleTooLong200
        if (
            extend &&
            (await Suggestion.find({ where: { extends: extend.number } })).some(
                async suggestion =>
                    (await suggestion.getIdentifier()).match(/\d+(?<l>[a-z])/).groups.l ==
                    extend.extension
            )
        )
            error = client.messages.alreadyExistsSubsuggestion

        if (error) {
            try {
                const messages = await client.response.sendError(message, error)
                if (message.channel.type !== "DM" && message.isNormalCommand())
                    message.delete().catch(() => null)
                return setTimeout(() => {
                    if (messages) messages.delete().catch(() => null)
                }, 10000)
            } catch {
                return null
            }
        }

        // delete message asap if suggestion is anonymous
        if (anon && message.channel.type !== "DM")
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
        const suggestions = client.channels.cache.get(
            suggestionsID
        ) as Discord.TextChannel

        const embed = await suggestion.displayEmbed(client)
        const suggestionMessage = await suggestions.send({ embeds: [embed] })
        suggestion.message = suggestionMessage.id

        if (extend?.extension) {
            const old = await Suggestion.findOne({ number: extend.number })
            const thread = await (
                client.channels.cache.get(
                    client.config.suggestions.discussion[staff ? "staff" : "main"]
                ) as Discord.TextChannel
            ).threads.fetch(old.thread)
            client.response.sendSuccess(thread, {
                description: `**New subsuggestion:** [${title}](${suggestion.getURL(
                    client
                )})`
            })
            await suggestion.save()
        } else {
            const newIdentifier = await suggestion.getIdentifier()
            const thread = await (
                suggestionMessage.channel as Discord.TextChannel
            ).threads.create({
                name: `${newIdentifier} - ${title}`,
                autoArchiveDuration: "MAX",
                startMessage: suggestionMessage
            })
            await thread.setRateLimitPerUser(1)
            suggestion.thread = thread.id
            await suggestion.save()
        }

        await suggestionMessage.react(client.config.emojis.upvote)
        await suggestionMessage.react(client.config.emojis.downvote)
        if (!anon && message.channel.type !== "DM")
            await message.delete().catch(() => null)
    }
})
