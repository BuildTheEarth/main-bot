import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import Roles from "../util/roles.util.js"
import Discord from "discord.js"
import CommandMessage from "../struct/CommandMessage.js"
import { hexToRGB } from "@buildtheearth/bot-utils"

export default new Command({
    name: "purge",
    aliases: ["prune", "bulkdelete"],
    description: "Bulk-delete messages in a channel.",
    permission: [Roles.MODERATOR, Roles.MANAGER],
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
        if (!amount)
            return client.response.sendError(message, client.messages.invalidAmount)
        if (Number.isNaN(amount))
            return client.response.sendError(message, client.messages.invalidAmount)
        if (amount > 100)
            return client.response.sendError(message, client.messages.purgeLimit)
        if (amount < 1)
            return client.response.sendError(message, client.messages.purgeTooLow)

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

        const originMessageState =
            message.message instanceof Discord.Message && purged.has(message.message.id)

        client.response.sendSuccess(
            originMessageState ? message.channel : message,
            `Purged ${purged.size} messages.`
        )
    }
})
