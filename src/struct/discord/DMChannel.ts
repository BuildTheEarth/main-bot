import Discord from "discord.js"
import Client from "../Client"
import Guild from "./Guild"

export default class DMChannel extends Discord.DMChannel {
    client: Client
    guild: Guild

    sendError(embed: string | Discord.MessageEmbedOptions): Promise<Discord.Message> {
        if (typeof embed === "string") embed = { description: embed }
        embed.color = this.client.config.colors.error
        return this.send({ embed })
    }

    sendSuccess(embed: string | Discord.MessageEmbedOptions): Promise<Discord.Message> {
        if (typeof embed === "string") embed = { description: embed }
        embed.color = this.client.config.colors.success
        return this.send({ embed })
    }
}
