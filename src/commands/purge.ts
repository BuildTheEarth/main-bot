import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import hexToRGB from "../util/hexToRGB"
import Discord from "discord.js"
import CommandMessage from "../struct/CommandMessage"
import errorMessage from "../util/errorMessage"

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
        if (Number.isNaN(amount))
            return client.response.sendError(message, errorMessage.invalidAmount)
        if (amount > 100)
            return client.response.sendError(message, errorMessage.purgeLimit)

        await message.continue()

        const purged = await (message.channel as Discord.TextChannel).bulkDelete(
            amount,
            true
        )
        await client.response.sendSuccess(message, `Purged ${purged.size} messages.`)
        await client.log({
            color: hexToRGB(client.config.colors.info),
            author: { name: "Purge" },
            description: `${purged.size} messages purged by ${message.member} in ${message.channel}.`
        })
    }
})
