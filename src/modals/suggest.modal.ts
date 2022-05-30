import Discord from "discord.js"
import Suggestion from "../entities/Suggestion.entity.js"
import { truncateString } from "@buildtheearth/bot-utils"
import { isSuggestInfo } from "../typings/InteractionInfo.js"

export default async function createSuggestion(
    interaction: Discord.ModalSubmitInteraction
): Promise<void> {
    const customId = interaction.customId
    const info = client.interactionInfo.get(customId)
    if (client.interactionInfo.has(customId) && isSuggestInfo(info)) {
        const anon = info.anon
        const title = interaction.fields.getTextInputValue("title")
        const body = interaction.fields.getTextInputValue("body")
        const teams = interaction.fields.getTextInputValue("teams")

        const staff = interaction.guild?.id === client.config.guilds.staff
        const suggestionsChannel = client.config.suggestions[staff ? "staff" : "main"]
        if (interaction.channel?.id !== suggestionsChannel)
            return client.response.sendError(
                interaction,
                `Please run this command in <#${suggestionsChannel}>!`
            )

        const identifier = info.subsuggestion
        const extend = identifier ? Suggestion.parseIdentifier(identifier) : null

        let error: string | null = null
        if (extend && !(await Suggestion.findOne({ number: extend.number })))
            error = `The suggestion you're trying to extend (**#${extend}**) doesn't exist!`
        if (!body) error = client.messages.getMessage("noBody", interaction.locale)
        if (!title) error = client.messages.getMessage("noTitle", interaction.locale)
        if (title?.length > 200)
            error = client.messages.getMessage("titleTooLong", interaction.locale)
        if (
            extend &&
            (await Suggestion.find({ where: { extends: extend.number } })).some(
                async suggestion =>
                    (await suggestion.getIdentifier()).match(/\d+(?<l>[a-z])/)?.groups
                        ?.l == extend.extension
            )
        )
            error = client.messages.getMessage(
                "alreadyExistsSubsuggestion",
                interaction.locale
            )
        if (error) {
            await client.response.sendError(interaction, error)
        }

        const suggestion = new Suggestion()
        if (extend?.number) suggestion.extends = extend.number
        else suggestion.number = await Suggestion.findNumber(staff, client)
        suggestion.author = interaction.user.id
        suggestion.anonymous = anon
        suggestion.title = title
        suggestion.body = body
        suggestion.teams = teams || undefined
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
            if (old?.thread) {
                const thread = await (
                    client.channels.cache.get(
                        client.config.suggestions.discussion[staff ? "staff" : "main"]
                    ) as Discord.TextChannel
                ).threads.fetch(old.thread)
                if (thread)
                    client.response.sendSuccess(thread, {
                        description: `**New subsuggestion:** [${title}](${suggestion.getURL(
                            client
                        )},)`
                    })
                await suggestion.save()
            }
        } else {
            const newIdentifier = await suggestion.getIdentifier()
            const thread = await (
                suggestionMessage.channel as Discord.TextChannel
            ).threads.create({
                name: `${newIdentifier} - ${truncateString(title, 10)}`,
                autoArchiveDuration: "MAX",
                startMessage: suggestionMessage
            })
            await thread.setRateLimitPerUser(1)
            suggestion.thread = thread.id
            await suggestion.save()
            client.response.sendSuccess(
                interaction,
                { description: "Suggestion created!" },
                true
            )
        }

        await suggestionMessage.react(client.config.emojis.upvote)
        await suggestionMessage.react(client.config.emojis.downvote)
        //some nice cleanup
        globalThis.client.interactionInfo.delete(customId)
    }
}
