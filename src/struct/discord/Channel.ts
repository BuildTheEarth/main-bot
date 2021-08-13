import Discord from "discord.js"
import Client from "../Client"
import hexToRGB from "../../util/hexToRGB"

export default class Channel {
    client: Client

    constructor(client: Client) {
        this.client = client
    }

    sendError(
        channel: Discord.TextBasedChannels,
        embed: string | Discord.MessageEmbedOptions
    ): Promise<Discord.Message> {
        if (typeof embed === "string") embed = { description: embed }
        embed.color = hexToRGB(this.client.config.colors.error)
        return channel.send({ embeds: [embed] })
    }

    sendSuccess(
        channel: Discord.TextBasedChannels,
        embed: string | Discord.MessageEmbedOptions
    ): Promise<Discord.Message> {
        if (typeof embed === "string") embed = { description: embed }
        embed.color = hexToRGB(this.client.config.colors.success)
        return channel.send({ embeds: [embed] })
    }
}
