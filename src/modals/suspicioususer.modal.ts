import { ModalSubmitInteraction } from "discord.js"
import BotClient from "../struct/BotClient.js"
import { isSuspiciousUserModalInfo } from "../typings/InteractionInfo.js"

export default async function createSuspiciousUser(
    interaction: ModalSubmitInteraction,
    client: BotClient
): Promise<void> {
    const customId = interaction.customId
    const info = client.interactionInfo.get(customId)
    if (client.interactionInfo.has(customId) && isSuspiciousUserModalInfo(info)) {
        const reason = interaction.fields.getTextInputValue("reason")

        if (info.type === "approved") {
            await info.suspiciousUser.acceptReport(interaction.user.id, reason)
            await client.response.sendSuccess(
                interaction,
                client.messages.getMessage("approvedReport", interaction.locale),
                true
            )
        }
        if (info.type === "denied") {
            await info.suspiciousUser.denyReport(interaction.user.id, reason)
            await client.response.sendSuccess(
                interaction,
                client.messages.getMessage("deniedReport", interaction.locale),
                true
            )
        }

        // be good to the environment (alias the memory) and delete the entry since its trash now
        client.interactionInfo.delete(customId)
    }
}
