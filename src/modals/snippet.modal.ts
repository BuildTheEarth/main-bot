import { ModalSubmitInteraction } from "discord.js"
import Snippet from "../entities/Snippet.entity.js"
import BotClient from "../struct/BotClient.js"
import languages from "../struct/client/iso6391.js"
import { isSnippetInfo } from "../typings/InteractionInfo.js"

export default async function createSnippet(
    interaction: ModalSubmitInteraction,
    client: BotClient
): Promise<void> {
    const customId = interaction.customId
    const info = client.interactionInfo.get(customId)
    if (client.interactionInfo.has(customId) && isSnippetInfo(info)) {
        const body = interaction.fields.getTextInputValue("body")

        let snippet: Snippet | null = null
        if (info.subcommand === "add") {
            snippet = new Snippet()
            snippet.name = info.name
            snippet.language = info.language
            snippet.body = body
            snippet.aliases = []
            snippet.type = info.type
        } else if (info.subcommand === "edit") {
            if (info.existingSnippet?.body === body) {
                await client.response.sendError(
                    interaction,
                    client.messages.getMessage("noChange", interaction.locale)
                )
                return
            }
            if (info.existingSnippet) snippet = info.existingSnippet
            if (snippet) snippet.body = body
        }
        await snippet?.save()
        const past = info.subcommand === "add" ? "Added" : "Edited"
        const languageName = languages.getName(info.language)
        // prettier-ignore
        await client.response.sendSuccess(interaction, `${past} **${info.name}** ${info.type} in ${languageName}.`)
        //some nice cleanup
        client.interactionInfo.delete(customId)
    }
}
