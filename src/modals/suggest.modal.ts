import Discord, { Message } from "discord.js"
import Suggestion from "../entities/Suggestion.entity.js"
import { truncateString, flattenMarkdown } from "@buildtheearth/bot-utils"

export default async function createSuggestion(
    interaction: Discord.ModalSubmitInteraction
): Promise<void> {
    interaction.reply({ content: "Created suggestion!", ephemeral: true })
    const anon =
        interaction.fields.getTextInputValue("anon").toLowerCase() === "anon"
            ? true
            : false
    const title = interaction.fields.getTextInputValue("title")
    const body = interaction.fields.getTextInputValue("body")
    const teams = interaction.fields.getTextInputValue("teams")

    const staff = interaction.guild?.id === client.config.guilds.staff

    const suggestion = new Suggestion()
    suggestion.number = await Suggestion.findNumber(staff, client)
    suggestion.author = interaction.customId.split(".")[1]
    suggestion.anonymous = anon
    suggestion.title = title
    suggestion.body = body
    suggestion.teams = teams || null
    suggestion.staff = staff

    const category = staff ? "staff" : "main"
    const suggestionsID = client.config.suggestions[category]
    const suggestions = client.channels.cache.get(suggestionsID) as Discord.TextChannel

    const embed = await suggestion.displayEmbed(client)
    const suggestionmessage = await suggestions.send({ embeds: [embed] })
    suggestion.message = suggestionmessage.id

    const newIdentifier = await suggestion.getIdentifier()
    const thread = await (
        suggestionmessage.channel as Discord.TextChannel
    ).threads.create({
        name: `${newIdentifier} - ${truncateString(title, 10)}`,
        autoArchiveDuration: "MAX",
        startMessage: suggestionmessage
    })
    await thread.setRateLimitPerUser(1)
    suggestion.thread = thread.id
    await suggestion.save()

    await suggestionmessage.react(client.config.emojis.upvote)
    await suggestionmessage.react(client.config.emojis.downvote)
}
