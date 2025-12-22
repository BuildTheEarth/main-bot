import Client from "../struct/Client.js"
import Command from "../struct/Command.js"

import CommandMessage from "../struct/CommandMessage.js"
import Args from "../struct/Args.js"
import { formatTimestamp, noop } from "@buildtheearth/bot-utils"
import fetch from "node-fetch"
import _ from "lodash"
import Discord from "discord.js"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isNil(value: any): value is null | undefined {
    return value?.length === 0 || _.isNil(value)
}

export default new Command({
    name: "embed",
    aliases: [],
    description: "embed",
    permission: globalThis.client.roles.ANY,
    args: [
        {
            name: "message",
            description: "The message to fetch the embeds from.",
            optionType: "STRING",
            required: true
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {

        await message.continue()

        const urlRegex =
            /(?<=(https:\/\/)(canary\.discord\.com\/channels\/|discord\.com\/channels\/|ptb\.discord\.com\/channels\/))([0-9]{17,})(\/)([0-9]{17,})(\/)([0-9]{17,})/
        const messageUrl = args.get("message")
        if (!messageUrl) return message.sendErrorMessage("provideMsgUrl")
        if (!urlRegex.test(messageUrl)) return message.sendErrorMessage("provideMsgUrl")
        const messagePropsTemp = urlRegex.exec(messageUrl)
        if (!messagePropsTemp) return message.sendErrorMessage("provideMsgUrl")
        const messageProps = {
            guildId: messagePropsTemp[3],
            channelId: messagePropsTemp[5],
            messageId: messagePropsTemp[7]
        }


        const guild = await client.guilds.fetch(messageProps.guildId).catch(noop)

        if (!guild) {
            return message.sendErrorMessage("provideMsgUrl")
        }

        const channel = await guild.channels.fetch(messageProps.channelId).catch(noop)

        if (!channel) return message.sendErrorMessage("provideMsgUrl")

        if (!client.user) return message.sendErrorMessage("provideMsgUrl")

        const perms =
            channel.permissionsFor(message.member) &&
            channel
                .permissionsFor(client.user)
                ?.has(Discord.PermissionFlagsBits.ViewChannel)
        if (!perms) return message.sendErrorMessage("noChannelPerms")

        if (!channel || !(channel.type === Discord.ChannelType.GuildText)) {
            return message.sendErrorMessage("provideMsgUrl")
        }

        const embedMessage = await channel.messages
            .fetch(messageProps.messageId)
            .catch(noop)

        if (!embedMessage) {
            return message.sendErrorMessage("provideMsgUrl")
        }

        const messageAttachments = [...embedMessage.attachments.values()].map((e) => e.toJSON())

        console.log(messageAttachments)


        const webhookJson = {
            messages: [
                {
                    data: {
                        content:
                            embedMessage.content === "" ? null : embedMessage.content,
                        embeds: _.cloneDeep(embedMessage.embeds).map(embed =>
                            _.omitBy(_.omit(embed.toJSON(), "type"), isNil)
                        ),
                        username: embedMessage.author.username,
                        avatar_url: embedMessage.author.displayAvatarURL({
                            extension: "png"
                        }),
                        attachments: messageAttachments
                    }
                }
            ]
        }

        const buffer = Buffer.from(JSON.stringify(webhookJson))
        const discohookUrl = `https://embed.buildtheearth.net/?data=${encodeURIComponent(
            buffer.toString("base64")
        )}`

        //@ts-ignore
        const fetchedData = await fetch("https://short.buildtheearth.net/create", {
            method: "POST",
            body: JSON.stringify({ url: discohookUrl }),
            headers: { "Content-Type": "application/json" }
        }).catch(noop)
        if (!fetchedData) {
            return message.sendErrorMessage("httpError")
        }
        const data = (await fetchedData.json().catch(noop)) as {
            url: string
            expires: string
        }

        if (!data?.url) {
            return message.sendErrorMessage("httpError")
        }

        return message.sendSuccessMessage(
            "discohookUrl",
            data.url.replace("https://", ""),
            data.url,
            formatTimestamp(new Date(data.expires), "R")
        )

        
    }
})
