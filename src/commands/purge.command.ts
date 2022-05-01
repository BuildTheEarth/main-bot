import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"

import Discord from "discord.js"
import CommandMessage from "../struct/CommandMessage.js"
import { hexToRGB } from "@buildtheearth/bot-utils"

export default new Command({
    name: "purge",
    aliases: [],
    description: "Bulk-delete messages in a channel.",
    permission: [globalThis.client.roles.MODERATOR, globalThis.client.roles.MANAGER],
    args: [
        {
            name: "amount",
            description: "Amount to purge.",
            required: true,
            optionType: "INTEGER"
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const amount = Number(args.consume("amount"))
        if (!amount) return message.sendErrorMessage("invalidAmount")
        if (Number.isNaN(amount)) return message.sendErrorMessage("invalidAmount")
        if (amount > 100) return message.sendErrorMessage("purgeLimit")
        if (amount < 1) return message.sendErrorMessage("purgeTooLow")

        const purged = await (message.channel as Discord.TextChannel).bulkDelete(
            amount,
            true
        )

        await message.continue()

        await client.log({
            color: hexToRGB(client.config.colors.info),
            author: { name: "Purge" },
            description: `${purged.size} messages purged by ${message.member} in ${message.channel}.`
        })

        const originMessageState = false && purged.has(message.message.id)

        //using client.response is required here because the message is deleted
        client.response.sendSuccess(
            originMessageState ? message.channel : message,
            message.getMessage("purgedXMessages", purged.size)
        )
    }
})
