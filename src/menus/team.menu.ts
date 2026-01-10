import { noop } from "@buildtheearth/bot-utils"
import BotClient from "../struct/BotClient.js"
import { ButtonInteraction, MessageFlags } from "discord.js"

export default async function teamMenu(
    client: BotClient,
    interaction: ButtonInteraction
): Promise<any> {
    const continent = interaction.customId

    const validContinents = [
        "info.teams.NA",
        "info.teams.LA",
        "info.teams.EU",
        "info.teams.AF",
        "info.teams.AS",
        "info.teams.OC",
        "info.teams.OT"
    ]

    if (!validContinents.includes(continent))
        return await interaction
            .reply({ content: "Invalid Region", flags: MessageFlags.Ephemeral })
            .catch(noop)

    const data = client.assets.getAsset(continent)

    if (!data)
        return await interaction
            .reply({ content: "Invalid Region", flags: MessageFlags.Ephemeral })
            .catch(noop)

    return await interaction.reply(data).catch(noop)
}
