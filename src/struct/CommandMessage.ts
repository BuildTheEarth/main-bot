import Discord from "discord.js"
import Client from "../struct/Client.js"

export default class CommandMessage {
    message: Discord.CommandInteraction | Discord.Message
    channel: Discord.TextBasedChannel
    member: Discord.GuildMember
    author: Discord.User
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
        if (this.message instanceof Discord.Message) this.author = this.message.author
        if (this.message instanceof Discord.CommandInteraction)
            this.author = this.message.user as Discord.User
    }

    async send(payload: MessageOptions): Promise<CommandMessage> {
        if (this.isNormalCommand()) {
            if (!payload.allowedMentions) payload.allowedMentions = { repliedUser: false }
            return new CommandMessage(
                await this.message.reply(payload as Discord.ReplyMessageOptions),
                this.client
            )
        }
        if (this.isSlashCommand()) {
            if (this.message.deferred)
                await this.message.followUp(payload as Discord.InteractionReplyOptions)
            else await this.message.reply(payload as Discord.InteractionReplyOptions)

            return this
        }
    }

    async react(emoji: string): Promise<CommandMessage | Discord.MessageReaction> {
        if (this.isNormalCommand()) return await this.message.react(emoji)
        if (this.isSlashCommand())
            return new CommandMessage(
                (await this.message.followUp({
                    ephemeral: true,
                    content: emoji
                })) as Discord.Message,
                this.client
            )
    }

    async delete(): Promise<CommandMessage | void> {
        if (this.isNormalCommand())
            return new CommandMessage(await this.message.delete(), this.client)
        if (this.isSlashCommand())
            try {
                this.message.deleteReply()
            } catch {
                return
            }
        return
    }

    async edit(payload: MessageOptions): Promise<CommandMessage> {
        if (this.isNormalCommand()) {
            if (!payload.allowedMentions) payload.allowedMentions = { repliedUser: false }
            return new CommandMessage(
                await this.message.edit(payload as Discord.ReplyMessageOptions),
                this.client
            )
        }
        if (this.isSlashCommand()) {
            await this.message.editReply(payload as Discord.InteractionReplyOptions)

            return this
        }
    }

    isSlashCommand(): this is this & { message: Discord.CommandInteraction } {
        if (this.message instanceof Discord.Message) return false
        if (this.message instanceof Discord.CommandInteraction) return true
    }

    isNormalCommand(): this is this & { message: Discord.Message } {
        if (this.message instanceof Discord.Message) return true
        if (this.message instanceof Discord.CommandInteraction) return false
    }

    async continue(): Promise<CommandMessage> {
        if (this.isSlashCommand()) await this.message.deferReply()
        return this
    }
}

export interface MessageOptions {
    ephemeral?: boolean
    embeds?: Discord.MessageEmbedOptions[]
    components?: Discord.MessageComponent[]
    content?: string
    allowedMentions?: Discord.MessageMentionOptions
    files?:
        | Discord.FileOptions[]
        | Discord.BufferResolvable[]
        | Discord.MessageAttachment[]
}
