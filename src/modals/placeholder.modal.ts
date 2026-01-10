import { ModalSubmitInteraction } from "discord.js"
import BotClient from "../struct/BotClient.js"
import { isPlaceholderInfo } from "../typings/InteractionInfo.js"

export default async function createPlaceholder(
    interaction: ModalSubmitInteraction,
    client: BotClient
): Promise<void> {
    const customId = interaction.customId
    const info = client.interactionInfo.get(customId)
    if (client.interactionInfo.has(customId) && isPlaceholderInfo(info)) {
        const body = interaction.fields.getTextInputValue("body")

        if (info.subcommand === "add") {
            await client.placeholder.addPlaceholder(info.name, info.language, body)
            await client.response.sendSuccess(
                interaction,
                `Added placeholder ${info.name} (${info.language})`
            )

            const placeholderTemp = client.placeholder.cache.get(
                info.name + " " + info.language
            )

            if (placeholderTemp)
                await client.log(placeholderTemp, "add", interaction.user)
        } else if (info.subcommand === "edit") {
            if (info.existingPlaceholder?.body === body) {
                await client.response.sendError(
                    interaction,
                    client.messages.getMessage("noChange", interaction.locale)
                )
                return
            }

            await client.placeholder.editPlaceholder(info.name, info.language, body)
            await client.response.sendSuccess(
                interaction,
                `Edited placeholder ${info.name} (${info.language})`
            )

            const placeholderTemp = client.placeholder.cache.get(
                info.name + " " + info.language
            )

            if (placeholderTemp)
                await client.log(placeholderTemp, "edit", interaction.user)
        }
    }
}
