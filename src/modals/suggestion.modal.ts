import { ModalSubmitInteraction } from "discord.js"
import BotClient from "../struct/BotClient.js"
import { isSuggestionInfo } from "../typings/InteractionInfo.js"

export default async function editSuggestion(
    interaction: ModalSubmitInteraction,
    client: BotClient
): Promise<void> {
    const customId = interaction.customId
    const info = client.interactionInfo.get(customId)
    if (client.interactionInfo.has(customId) && isSuggestionInfo(info)) {
        const title = interaction.fields.getTextInputValue("title")
        const body = interaction.fields.getTextInputValue("body")
        const teams = interaction.fields.getTextInputValue("teams")

        info.suggestion.title = title
        info.suggestion.body = body
        info.suggestion.teams = teams
        await info.suggestion.save()

        const embed = await info.suggestion.displayEmbed(client)
        await info.message.edit({ embeds: [embed] })
        //some nice cleanup
        client.interactionInfo.delete(customId)
        await client.response.sendSuccess(interaction, {
            description: "Edited the suggestion!"
        })
        return
    }
}
