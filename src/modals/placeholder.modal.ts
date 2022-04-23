import Discord from "discord.js"
import Client from "../struct/Client.js"
import { isPlaceholderInfo } from "../typings/InteractionInfo.js"

export default async function createPlaceholder(
    interaction: Discord.ModalSubmitInteraction,
    client: Client
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
            client.log(
                client.placeholder.cache[info.name + " " + info.language],
                "add",
                interaction.user
            )
        } else if (info.subcommand === "edit") {
            if (info.existingPlaceholder.body === body)
                return client.response.sendError(
                    interaction,
                    client.messages.getMessage("noChange", interaction.locale)
                )
            await client.placeholder.editPlaceholder(info.name, info.language, body)
            await client.response.sendSuccess(
                interaction,
                `Edited placeholder ${info.name} (${info.language})`
            )
            client.log(
                client.placeholder.cache[info.name + " " + info.language],
                "edit",
                interaction.user
            )
        }
    }
}
