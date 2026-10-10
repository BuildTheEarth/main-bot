import Suggestion from "../entities/Suggestion.entity.js"
import { truncateString } from "@buildtheearth/bot-utils"
import { isSuggestInfo } from "../typings/InteractionInfo.js"
import {
    ModalSubmitInteraction,
    MessageFlags,
    TextChannel,
    ThreadAutoArchiveDuration
} from "discord.js"
import BotClient from "../struct/BotClient.js"

export default async function createSuggestion(
    interaction: ModalSubmitInteraction,
    client: BotClient
): Promise<void> {
    try {
        const customId = interaction.customId
        const info = client.interactionInfo.get(customId)
        if (!isSuggestInfo(info)) return
        const anon = info.anon
        const title = interaction.fields.getTextInputValue("title")
        const body = interaction.fields.getTextInputValue("body")
        const teams = interaction.fields.getTextInputValue("teams")

        const staff = interaction.guild?.id === client.config.guilds.staff
        const suggestionsChannel = client.config.suggestions[staff ? "staff" : "main"]
        if (interaction.channel?.id !== suggestionsChannel) {
            await client.response.sendError(
                interaction,
                `Please run this command in <#${suggestionsChannel}>!`
            )
            return
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral })
        const identifier = info.subsuggestion
        const extend = identifier ? Suggestion.parseIdentifier(identifier) : null

        let error: string | null = null
        const parent = extend
            ? await Suggestion.findOne({ number: extend.number, staff })
            : null
        if (extend && !parent)
            error = `The suggestion you're trying to extend (**#${identifier}**) doesn't exist!`
        if (!body) error = client.messages.getMessage("noBody", interaction.locale)
        if (!title) error = client.messages.getMessage("noTitle", interaction.locale)
        if (title?.length > 200)
            error = client.messages.getMessage("titleTooLong", interaction.locale)
        if (extend?.extension) {
            const subsuggestions = await Suggestion.find({
                where: { extends: extend.number, staff }
            })
            const identifiers = await Promise.all(
                subsuggestions.map(suggestion => suggestion.getIdentifier())
            )
            if (
                identifiers.some(value => value === `${extend.number}${extend.extension}`)
            )
                error = client.messages.getMessage(
                    "alreadyExistsSubsuggestion",
                    interaction.locale
                )
        }
        if (error) {
            await interaction.editReply({ content: error })
            return
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
        const suggestions = client.channels.cache.get(suggestionsID) as TextChannel

        const embed = await suggestion.displayEmbed(client)
        const suggestionMessage = await suggestions.send({ embeds: [embed] })
        suggestion.message = suggestionMessage.id

        if (extend?.extension) {
            if (parent?.thread) {
                const thread = await (
                    client.channels.cache.get(
                        client.config.suggestions.discussion[staff ? "staff" : "main"]
                    ) as TextChannel
                ).threads.fetch(parent.thread)
                if (thread)
                    await client.response.sendSuccess(thread, {
                        description: `**New subsuggestion:** [${title}](${suggestion.getURL(
                            client
                        )})`
                    })
            }
        } else {
            const newIdentifier = await suggestion.getIdentifier()
            const thread = await (
                suggestionMessage.channel as TextChannel
            ).threads.create({
                name: `${newIdentifier} - ${truncateString(title, 10)}`,
                autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
                startMessage: suggestionMessage
            })
            await thread.setRateLimitPerUser(1)
            suggestion.thread = thread.id
        }
        await suggestion.save()

        await interaction.editReply({ content: "Suggestion created!" })

        await suggestionMessage.react(client.config.emojis.upvote)
        await suggestionMessage.react(client.config.emojis.downvote)
    } catch (error) {
        client.logger.error(`Suggestion submission failed: ${String(error)}`)
        const content =
            "Could not finish creating your suggestion. Check the suggestions channel before trying again."
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content }).catch(() => null)
        } else {
            await interaction
                .reply({ content, flags: MessageFlags.Ephemeral })
                .catch(() => null)
        }
    } finally {
        client.interactionInfo.delete(interaction.customId)
    }
}
