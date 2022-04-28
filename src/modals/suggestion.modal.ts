import Discord from "discord.js"
import Client from "../struct/Client.js"
import { isSuggestionInfo } from "../typings/InteractionInfo.js"

export default async function editSuggestion(
    interaction: Discord.ModalSubmitInteraction,
    client: Client
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
        return client.response.sendSuccess(interaction, {
            description: "Edited the suggestion!"
        })
    }
}
