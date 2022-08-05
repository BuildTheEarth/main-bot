import { hexToNum } from "@buildtheearth/bot-utils"
import Discord from "discord.js"
import Client from "../Client.js"
import CommandMessage from "../CommandMessage.js"

export default class Response {
    client: Client

    constructor(client: Client) {
        this.client = client
    }

    async sendError(
        message: Discord.ModalSubmitInteraction,
        embed: string | Discord.APIEmbed,
        ephemeral?: boolean
    ): Promise<Discord.InteractionResponse>

    async sendError(
        message: Discord.ButtonInteraction,
        embed: string | Discord.APIEmbed,
        ephemeral?: boolean
    ): Promise<Discord.InteractionResponse>

    async sendError(
        message: CommandMessage,
        embed: string | Discord.APIEmbed,
        ephemeral?: boolean
    ): Promise<CommandMessage>

    async sendError(
        message: Discord.TextBasedChannel | Discord.Message,
        embed: string | Discord.APIEmbed,
        ephemeral?: boolean
    ): Promise<Discord.Message>

    async sendError(
        message: CommandMessage | Discord.TextBasedChannel | Discord.Message,
        embed: string | Discord.APIEmbed,
        ephemeral?: boolean
    ): Promise<Discord.Message | CommandMessage>

    async sendError(
        message:
            | CommandMessage
            | Discord.TextBasedChannel
            | Discord.Message
            | Discord.ModalSubmitInteraction
            | Discord.ButtonInteraction,
        embed: string | Discord.APIEmbed,
        ephemeral: boolean = true
    ): Promise<
        | CommandMessage
        | Discord.Message
        | Discord.ModalSubmitInteraction
        | Discord.InteractionResponse
    > {
        if (typeof embed === "string") embed = { description: embed }
        embed.color = hexToNum(this.client.config.colors.error)
        if (message instanceof CommandMessage)
            return message.send({ embeds: [embed], ephemeral: ephemeral })
        else if (message instanceof Discord.Message)
            return message.reply({
                embeds: [embed],
                allowedMentions: { repliedUser: false }
            })
        else if (message instanceof Discord.ModalSubmitInteraction)
            return message.reply({ embeds: [embed], ephemeral: ephemeral })
        else if (message instanceof Discord.ButtonInteraction)
            return message.reply({ embeds: [embed], ephemeral: ephemeral })
        else return message.send({ embeds: [embed] })
    }

    async sendSuccess(
        message: Discord.ButtonInteraction,
        embed: string | Discord.APIEmbed,
        ephemeral?: boolean
    ): Promise<Discord.InteractionResponse>

    async sendSuccess(
        message: Discord.ModalSubmitInteraction,
        embed: string | Discord.APIEmbed,
        ephemeral?: boolean
    ): Promise<Discord.InteractionResponse>

    async sendSuccess(
        message: CommandMessage,
        embed: string | Discord.APIEmbed,
        ephemeral?: boolean
    ): Promise<CommandMessage>

    async sendSuccess(
        message: Discord.TextBasedChannel | Discord.Message,
        embed: string | Discord.APIEmbed,
        ephemeral?: boolean
    ): Promise<Discord.Message>

    async sendSuccess(
        message: CommandMessage | Discord.TextBasedChannel | Discord.Message,
        embed: string | Discord.APIEmbed,
        ephemeral?: boolean
    ): Promise<Discord.Message | CommandMessage>

    async sendSuccess(
        message:
            | CommandMessage
            | Discord.TextBasedChannel
            | Discord.Message
            | Discord.ModalSubmitInteraction
            | Discord.ButtonInteraction,
        embed: string | Discord.APIEmbed,
        ephemeral: boolean = false
    ): Promise<CommandMessage | Discord.Message | Discord.InteractionResponse> {
        if (typeof embed === "string") embed = { description: embed }
        embed.color = hexToNum(this.client.config.colors.success)
        if (message instanceof CommandMessage)
            return message.send({ embeds: [embed], ephemeral: ephemeral })
        else if (message instanceof Discord.Message)
            return message.reply({
                embeds: [embed],
                allowedMentions: { repliedUser: false }
            })
        else if (message instanceof Discord.ModalSubmitInteraction)
            return message.reply({ embeds: [embed], ephemeral: ephemeral })
        else if (message instanceof Discord.ButtonInteraction)
            return message.reply({ embeds: [embed], ephemeral: ephemeral })
        else return message.send({ embeds: [embed] })
    }
}
