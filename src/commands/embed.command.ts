import Client from "../struct/Client.js"
import Command from "../struct/Command.js"

import CommandMessage from "../struct/CommandMessage.js"
import Args from "../struct/Args.js"
import { formatTimestamp, noop } from "@buildtheearth/bot-utils"
import fetch from "node-fetch"

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
        const urlRegex =
            /(?<=(https:\/\/)(canary\.discord\.com\/channels\/|discord\.com\/channels\/|ptb\.discord\.com\/channels\/))([0-9]{18})(\/)([0-9]{18})(\/)([0-9]{18})/
        const messageUrl = args.get("message")
        if (!messageUrl) return message.sendErrorMessage("provideMsgUrl")
        if (!urlRegex.test(messageUrl)) return message.sendErrorMessage("provideMsgUrl")
        const messagePropsTemp = urlRegex.exec(messageUrl)
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

        const perms =
            channel.permissionsFor(message.member) &&
            channel.permissionsFor(client.user).has("VIEW_CHANNEL")
        if (!perms) return message.sendErrorMessage("noChannelPerms")

        if (!channel || !channel.isText()) {
            return message.sendErrorMessage("provideMsgUrl")
        }

        const embedMessage = await channel.messages
            .fetch(messageProps.messageId)
            .catch(noop)

        if (!embedMessage) {
            return message.sendErrorMessage("provideMsgUrl")
        }

        const webhookJson = {
            messages: [
                {
                    data: {
                        content: embedMessage.content,
                        embeds: embedMessage.embeds.map(embed => embed.toJSON()),
                        username: embedMessage.author.username,
                        avatar_url: embedMessage.author.displayAvatarURL({
                            format: "png"
                        })
                    }
                }
            ]
        }

        console.log(webhookJson)

        const buffer = Buffer.from(JSON.stringify(webhookJson))
        const discohookUrl = `https://discohook.org/?data=${buffer.toString("base64")}`

        console.log(discohookUrl)

        //@ts-ignore
        const fetchedData = await fetch("https://share.discohook.app/create", {
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
            data.url,
            formatTimestamp(new Date(data.expires), "R")
        )
    }
})
