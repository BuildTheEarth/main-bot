import Discord from "discord.js"
import Client from "../struct/Client.js"
import { vsprintf } from "sprintf-js"

export default class CommandMessage {
    message: Discord.CommandInteraction
    channel: Discord.TextBasedChannel
    member: Discord.GuildMember
    author: Discord.User
    client: Client
    guild: Discord.Guild
    id: Discord.Snowflake
    createdTimestamp: number
    messages: Record<string, string>
    locale: string

    constructor(message: Discord.CommandInteraction, client: Client) {
        this.client = client
        this.message = message
        this.channel = message.channel
        this.guild = message.guild
        this.id = message.id
        this.createdTimestamp = message.createdTimestamp
        //set author property to message author
        this.member = this.message.member as Discord.GuildMember
        this.author = this.message.user as Discord.User
        this.locale = this.message.locale
        this.messages = new Proxy(
            {},
            {
                get: (_unused, key: string): string => {
                    return this.client.messages.getMessage(key, this.locale)
                }
            }
        )
    }

    public async sendError(
        embed: string | Discord.MessageEmbedOptions,
        ephemeral: boolean = false
    ): Promise<CommandMessage> {
        return client.response.sendError(this, embed, ephemeral)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async sendErrorMessage(
        message: string,
        ...args: any[]
    ): Promise<CommandMessage> {
        return client.response.sendError(this, vsprintf(this.messages[message], args))
    }

    public async sendSuccess(
        embed: string | Discord.MessageEmbedOptions,
        ephemeral: boolean = false
    ): Promise<CommandMessage> {
        return client.response.sendSuccess(this, embed, ephemeral)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async sendSuccessMessage(
        message: string,
        ...args: any[]
    ): Promise<CommandMessage> {
        return client.response.sendSuccess(this, vsprintf(this.messages[message], args))
    }

    async send(payload: MessageOptions): Promise<CommandMessage> {
        if (this.message.deferred)
            await this.message.followUp(payload as Discord.InteractionReplyOptions)
        else await this.message.reply(payload as Discord.InteractionReplyOptions)

        return this
    }

    async react(emoji: string): Promise<CommandMessage> {
        await this.message.followUp({
            ephemeral: true,
            content: emoji
        })

        return this
    }

    async delete(): Promise<CommandMessage | void> {
        try {
            this.message.deleteReply()
        } catch {
            return
        }
        return
    }

    async edit(payload: MessageOptions): Promise<CommandMessage> {
        await this.message.editReply(payload as Discord.InteractionReplyOptions)

        return this
    }

    isSlashCommand(): this is this & { message: Discord.CommandInteraction } {
        //Literally to avoid some extra refactoring cause of typeguard stuff
        return true
    }

    isNormalCommand(): this is this & { message: Discord.Message } {
        //Literally to avoid some extra refactoring cause of typeguard stuff
        return false
    }

    async continue(): Promise<CommandMessage> {
        await this.message.deferReply()
        return this
    }

    async showModal(modal: Discord.Modal): Promise<void> {
        if (this.isSlashCommand()) {
            this.message.showModal(modal)
        }
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
