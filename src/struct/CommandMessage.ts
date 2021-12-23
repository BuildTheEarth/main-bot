import DiscordEnums from "discord.js/typings/enums"
import Discord from "discord.js"
import Client from "../struct/Client"
import ApiTypes from "discord-api-types/v9"

export default class CommandMessage {
    message: Discord.CommandInteraction | Discord.Message
    channel: Discord.TextBasedChannels
    member: Discord.GuildMember
    client: Client
    guild: Discord.Guild
    id: Discord.Snowflake
    createdTimestamp: number

    constructor(message: Discord.CommandInteraction | Discord.Message, client: Client) {
        this.client = client
        this.message = message
        this.channel = message.channel
        this.guild = message.guild
        this.id = message.id
        this.createdTimestamp = message.createdTimestamp
        //set author property to message author
        if (this.message instanceof Discord.Message) this.member = this.message.member
        if (this.message instanceof Discord.CommandInteraction)
            this.member = this.message.member as Discord.GuildMember
    }

    async send(payload: MessageOptions): Promise<CommandMessage> {
        if (this.message instanceof Discord.Message) {
            if (!payload.allowedMentions) payload.allowedMentions = { repliedUser: false }
            return new CommandMessage(
                await this.message.reply(payload as Discord.ReplyMessageOptions),
                this.client
            )
        }
        if (this.message instanceof Discord.CommandInteraction) {
            await this.message.reply(payload as Discord.InteractionReplyOptions)

            return this
        }
    }

    async react(emoji: string): Promise<CommandMessage | Discord.MessageReaction> {
        if (this.message instanceof Discord.Message)
            return await this.message.react(emoji)
        if (this.message instanceof Discord.CommandInteraction)
            return new CommandMessage(
                (await this.message.followUp({
                    ephemeral: true,
                    content: emoji
                })) as Discord.Message,
                this.client
            )
    }

    async delete(): Promise<CommandMessage | void> {
        if (this.message instanceof Discord.Message)
            return new CommandMessage(await this.message.delete(), this.client)
        if (this.message instanceof Discord.CommandInteraction)
            try {
                this.message.deleteReply()
            } catch {
                return
            }
        return
    }

    async edit(payload: MessageOptions): Promise<CommandMessage> {
        if (this.message instanceof Discord.Message) {
            if (!payload.allowedMentions) payload.allowedMentions = { repliedUser: false }
            return new CommandMessage(
                await this.message.edit(payload as Discord.ReplyMessageOptions),
                this.client
            )
        }
        if (this.message instanceof Discord.CommandInteraction) {
            await this.message.editReply(payload as Discord.InteractionReplyOptions)

            return this
        }
    }

    isSlashCommand(): boolean {
        if (this.message instanceof Discord.Message) return false
        if (this.message instanceof Discord.CommandInteraction) return true
    }
}

export interface MessageOptions {
    ephemeral?: boolean
    embeds?: Discord.MessageEmbedOptions[]
    components?: Discord.MessageComponent[]
    content?: string
    allowedMentions?: Discord.MessageMentionOptions
}
