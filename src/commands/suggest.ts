import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Suggestion from "../entities/Suggestion"
import Roles from "../util/roles"
import TextChannel from "../struct/discord/TextChannel"

export default new Command({
    name: "suggest",
    aliases: [],
    description: "Make a suggestion.",
    permission: Roles.ANY,
    usage: "['anon'] <title> | <body> | [team/s]",
    async run(this: Command, client: Client, message: Message, args: Args) {
        var filteredTimeouts = client.timeouts.filter(x => x.id === message.author.id)
        if(filteredTimeouts.length === 1) {
            if((Date.now()) > (filteredTimeouts[0].time + 600000)) {
                client.timeouts.splice(client.timeouts.findIndex(x => x.id === message.author.id),1)
            } else {
                var date = new Date()
                date.setTime(filteredTimeouts[0].time+600000)
                if(message.channel.type != "dm")
                    message.delete()
                const erMessage = await message.channel.sendError(`You can not send another suggestion until ${date.toUTCString()}.`)
                return await erMessage.delete({ timeout: 10000 })
            }
        }
        const anon = args.consumeIf(a => ["anon", "anonymous"].includes(a.toLowerCase()))
        var staff = false
        if(message.guild) {
           staff = message.guild.id === client.config.guilds.staff
        }
        
        const suggestionsChannel = client.config.suggestions[staff ? "staff" : "main"]
        if (message.channel.id !== suggestionsChannel && message.channel.type != "dm")
            return message.channel.sendError(
                `Please run this command in <#${suggestionsChannel}>!`
            )

        args.separator = "|"
        const [title, body, teams] = args.consume(3)

        let error: string
        if (!title) error = "You must specify a title!"
        if (title.length > 99) error = "That title is too long!"
        if (!body) error = "You must specify a suggestion body!"

        if (error) {
            if(message.channel.type !== "dm") {
                await message.delete()
            }
            const errorMessage = await message.channel.sendError(error)
            return await errorMessage.delete({ timeout: 10000 })
        }

        // delete message asap if suggestion is anonymous
        if (anon && message.channel.type != "dm") await message.delete()
        else message.react("👌")

        const suggestion = new Suggestion()
        suggestion.number = await Suggestion.findNumber(staff)
        suggestion.author = message.author.id
        suggestion.anonymous = Boolean(anon)
        suggestion.title = title
        suggestion.body = body
        suggestion.teams = teams || null
        suggestion.staff = staff
        const sugChannel = client.guilds.cache.get(client.config.guilds.main).channels.cache.get(suggestionsChannel)

        const suggestionMessage = await (sugChannel as TextChannel).send({
            embed: await suggestion.displayEmbed(client)
        })
        client.timeouts.push({id:message.author.id,time: new Date().getTime()})
        suggestion.message = suggestionMessage.id
        await suggestion.save()

        await suggestionMessage.react(client.config.emojis.upvote)
        await suggestionMessage.react(client.config.emojis.downvote)
        if ((!anon) && message.channel.type != "dm") await message.delete()
    }
})
