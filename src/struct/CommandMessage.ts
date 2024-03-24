/* eslint-disable @typescript-eslint/no-explicit-any */
import Discord from "discord.js"
import Client from "../struct/Client.js"
import { vsprintf } from "sprintf-js"
import _ from "lodash"
import { noop } from "@buildtheearth/bot-utils"
import replaceTypes from "../util/replaceTypes.util.js"

export default class CommandMessage {
    message: Discord.ChatInputCommandInteraction
    channel!: Discord.TextBasedChannel
    member: Discord.GuildMember
    author: Discord.User
    client: Client
    guild!: Discord.Guild
    id: Discord.Snowflake
    createdTimestamp: number
    messages: Record<string, string>
    locale: string

    constructor(message: Discord.ChatInputCommandInteraction, client: Client) {
        this.client = client
        this.message = message
        if (message.channel) this.channel = message.channel
        if (message.guild) this.guild = message.guild
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
        embed: string | Discord.APIEmbed,
        ephemeral: boolean = true
    ): Promise<CommandMessage> {
        return client.response.sendError(this, embed, ephemeral)
    }

    public async sendErrorMessage(
        message: string,
        ...args: any[]
    ): Promise<CommandMessage> {
        return client.response.sendError(this, vsprintf(this.messages[message], args))
    }

    public async sendErrorMessageSeen(
        message: string,
        ...args: any[]
    ): Promise<CommandMessage> {
        return client.response.sendError(
            this,
            vsprintf(this.messages[message], args),
            false
        )
    }

    public getMessage(message: string, ...args: any[]): string {
        return vsprintf(this.messages?.[message], args)
    }

    public async sendSuccess(
        embed: string | Discord.APIEmbed,
        ephemeral: boolean = false
    ): Promise<CommandMessage> {
        return client.response.sendSuccess(this, embed, ephemeral)
    }

    public async sendSuccessMessage(
        message: string,
        ...args: any[]
    ): Promise<CommandMessage> {
        return client.response.sendSuccess(this, vsprintf(this.messages[message], args))
    }

    public async sendSuccessMessageUnseen(
        message: string,
        ...args: any[]
    ): Promise<CommandMessage> {
        return client.response.sendSuccess(
            this,
            vsprintf(this.messages[message], args),
            false
        )
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
            if (!this.message.ephemeral) await this.message.deleteReply().catch(noop)
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

    async showModal(
        modalName: string,
        placeholders?: Record<string, string | undefined>
    ): Promise<string> {
        return CommandMessage.showModal(
            this.client,
            this.message,
            modalName,
            placeholders
        )
    }

    public static async showModal(
        client: Client,
        interaction: Discord.CommandInteraction | Discord.ButtonInteraction,
        modalName: string,
        placeholders?: Record<string, string | undefined>
    ): Promise<string> {
        const modal = _.cloneDeep(
            client.modals.getLocaleModal(modalName, interaction.locale)
        )
        if (!modal) throw new Error(`Modal ${modalName} not found`)
        modal.customId += "." + interaction.id
        if (placeholders) {
            modal.components.forEach(componentPar => {
                const componentParPartialTyped = componentPar as {
                    components: {
                        value: string
                        customId: string
                    }[]
                }
                componentParPartialTyped.components.forEach(component => {
                    if (placeholders[component.customId] !== undefined) {
                        // @ts-ignore @eslint-disable-next-line @typescript-eslint/no-explicit-any
                        component.value = placeholders[component.customId]
                    }
                })
            })
        }
        await interaction.showModal(
            new Discord.ModalBuilder(
                replaceTypes(
                    modal as {
                        components:
                            | Discord.ActionRowData<Discord.ModalActionRowComponentData>[]
                        customId: string
                        title: string
                    }
                )
            )
        )
        console.log(modal)
        return modal.customId
    }
}

export interface MessageOptions {
    ephemeral?: boolean
    embeds?: Discord.APIEmbed[]
    components?: Discord.MessageComponent[]
    content?: string
    allowedMentions?: Discord.MessageMentionOptions
    files?:
        | {
              attachment: Discord.BufferResolvable
              name?: string
              description: string
          }
        | Discord.BufferResolvable[]
        | Discord.Attachment[]
        | Discord.AttachmentBuilder[]
}
