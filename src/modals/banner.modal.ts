import Discord from "discord.js"
import BannerImage from "../entities/BannerImage.entity.js"
import fetch from "node-fetch"

export default async function createBanner(
    interaction: Discord.ModalSubmitInteraction
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
        return interaction.reply(
            client.messages.getMessage("requestIncomplete", interaction.locale)
        )
    }

    if (isBig)
        return interaction.reply(
            client.messages.getMessage("contentTooLarge10MB", interaction.locale)
        )

    const banner = new BannerImage()
    banner.url = image
    banner.location = location
    banner.credit = credit
    if (description) banner.description = description
    await banner.save()

    await interaction.reply(`Queued the banner! (**#${banner.id}**).`)
}
