import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import hexToRGB from "../util/hexToRGB"
import Discord from "discord.js"

export default new Command({
    name: "purge",
    aliases: ["prune", "bulkdelete"],
    description: "Bulk-delete messages in a channel.",
    permission: [Roles.MODERATOR, Roles.MANAGER],
    usage: "<amount>",
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const amount = Number(args.consume())
        if (Number.isNaN(amount))
            return client.channel.sendError(
                message.channel,
                "You must provide a valid amount!"
            )
        if (amount > 100)
            return client.channel.sendError(
                message.channel,
                "You can only purge 100 messages at a time!"
            )
        const purged = await (message.channel as Discord.TextChannel).bulkDelete(
            amount,
            true
        )
        await client.channel.sendSuccess(
            message.channel,
            `Purged ${purged.size} messages.`
        )
        await client.log({
            color: hexToRGB(client.config.colors.info),
            author: { name: "Purge" },
            description: `${purged.size} messages purged by ${message.author} in ${message.channel}.`
        })
    }
})
