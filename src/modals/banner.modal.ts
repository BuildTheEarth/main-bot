import { ModalSubmitInteraction } from "discord.js"
import BannerImage from "../entities/BannerImage.entity.js"
import fetch from "node-fetch"
import BotClient from "../struct/BotClient.js"

export default async function createBanner(
    interaction: ModalSubmitInteraction,
    client: BotClient
): Promise<void> {
    const image = interaction.fields.getTextInputValue("img_url")
    const location = interaction.fields.getTextInputValue("location")
    const credit = interaction.fields.getTextInputValue("credit")
    const description = interaction.fields.getTextInputValue("description")

    let isBig: boolean
    try {
        const res = (await fetch(image, { method: "HEAD" })).headers.get("content-length")
        if (res == undefined) throw new Error()
        isBig = Number.parseInt(res) > 10485760
    } catch (e) {
        await client.response.sendError(
            interaction,
            client.messages.getMessage("requestIncomplete", interaction.locale)
        )
        return
    }

    if (isBig) {
        await client.response.sendError(
            interaction,
            client.messages.getMessage("contentTooLarge10MB", interaction.locale)
        )
        return
    }

    const banner = new BannerImage()
    banner.url = image
    banner.location = location
    banner.credit = credit
    if (description) banner.description = description
    await banner.save()

    await client.response.sendSuccess(
        interaction,
        `Queued the banner! (**#${banner.id}**).`
    )
}
