import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import hexToRGB from "../util/hexToRGB"
import Discord from "discord.js"
import CommandMessage from "../struct/CommandMessage"

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

        await message.continue()

        const purged = await (message.channel as Discord.TextChannel).bulkDelete(
            amount,
            true
        )
        await client.log({
            color: hexToRGB(client.config.colors.info),
            author: { name: "Purge" },
            description: `${purged.size} messages purged by ${message.member} in ${message.channel}.`
        })
        //yes this is a bad way to do this but it works for now
        //client.response.sendSuccess(message, `Purged ${purged.size} messages.`) is not an option because the command message is deleted
        //I just need the bot to not crash
        message.channel.send({
            embeds: [
                {
                    description: `Purged ${purged.size} messages.`,
                    color: hexToRGB(client.config.colors.success)
                }
            ]
        })
    }
})
