import { hexToNum } from "@buildtheearth/bot-utils"
import BotClient from "../BotClient.js"
import CommandMessage from "../CommandMessage.js"
import { ModalSubmitInteraction, APIEmbed, InteractionResponse, ButtonInteraction, TextBasedChannel, Message, PartialGroupDMMessageManager, PartialGroupDMChannel, MessageFlags } from "discord.js"

export default class Response {
    client: BotClient

    constructor(client: BotClient) {
        this.client = client
    }

    async sendError(
        message: ModalSubmitInteraction,
        embed: string | APIEmbed,
        ephemeral?: boolean
    ): Promise<InteractionResponse>

    async sendError(
        message: ButtonInteraction,
        embed: string | APIEmbed,
        ephemeral?: boolean
    ): Promise<InteractionResponse>

    async sendError(
        message: CommandMessage,
        embed: string | APIEmbed,
        ephemeral?: boolean
    ): Promise<CommandMessage>

    async sendError(
        message: TextBasedChannel | Message,
        embed: string | APIEmbed,
        ephemeral?: boolean
    ): Promise<Message>

    async sendError(
        message: CommandMessage | TextBasedChannel | Message,
        embed: string | APIEmbed,
        ephemeral?: boolean
    ): Promise<Message | CommandMessage>

    async sendError(
        message:
            | CommandMessage
            | TextBasedChannel
            | Message
            | ModalSubmitInteraction
            | ButtonInteraction,
        embed: string | APIEmbed,
        ephemeral: boolean = true
    ): Promise<
        | CommandMessage
        | Message
        | ModalSubmitInteraction
        | InteractionResponse
    > {
        if (typeof embed === "string") embed = { description: embed }
        embed.color = hexToNum(this.client.config.colors.error)
        if (message instanceof CommandMessage)
            return message.send({ embeds: [embed], ephemeral: ephemeral })
        else if (message instanceof Message)
            return message.reply({
                embeds: [embed],
                allowedMentions: { repliedUser: false }
            })
        else if (message instanceof ModalSubmitInteraction)
            return message.reply({ embeds: [embed], flags: ephemeral ? MessageFlags.Ephemeral : undefined })
        else if (message instanceof ButtonInteraction)
            return message.reply({ embeds: [embed], flags: ephemeral ? MessageFlags.Ephemeral : undefined })
        else if (message.isSendable()) return message.send({ embeds: [embed] })
        
        return (await message.fetchOwner()).send({ embeds: [embed] })
    }

    async sendSuccess(
        message: ButtonInteraction,
        embed: string | APIEmbed,
        ephemeral?: boolean
    ): Promise<InteractionResponse>

    async sendSuccess(
        message: ModalSubmitInteraction,
        embed: string | APIEmbed,
        ephemeral?: boolean
    ): Promise<InteractionResponse>

    async sendSuccess(
        message: CommandMessage,
        embed: string | APIEmbed,
        ephemeral?: boolean
    ): Promise<CommandMessage>

    async sendSuccess(
        message: TextBasedChannel | Message,
        embed: string | APIEmbed,
        ephemeral?: boolean
    ): Promise<Message>

    async sendSuccess(
        message: CommandMessage | TextBasedChannel | Message,
        embed: string | APIEmbed,
        ephemeral?: boolean
    ): Promise<Message | CommandMessage>

    async sendSuccess(
        message:
            | CommandMessage
            | TextBasedChannel
            | Message
            | ModalSubmitInteraction
            | ButtonInteraction,
        embed: string | APIEmbed,
        ephemeral: boolean = false
    ): Promise<CommandMessage | Message | InteractionResponse> {
        if (typeof embed === "string") embed = { description: embed }
        embed.color = hexToNum(this.client.config.colors.success)
        if (message instanceof CommandMessage)
            return message.send({ embeds: [embed], ephemeral: ephemeral })
        else if (message instanceof Message)
            return message.reply({
                embeds: [embed],
                allowedMentions: { repliedUser: false, parse: ['users'] }
            })
        else if (message instanceof ModalSubmitInteraction)
            return message.reply({
                embeds: [embed],
                flags: ephemeral ? MessageFlags.Ephemeral : undefined,
                allowedMentions: { repliedUser: false, parse: ['users'] }
            })
        else if (message instanceof ButtonInteraction)
            return message.reply({ embeds: [embed], flags: ephemeral ? MessageFlags.Ephemeral : undefined })
        else if (message.isSendable()) return message.send({ embeds: [embed] })
        
        return (await message.fetchOwner()).send({ embeds: [embed] })
    }
}
