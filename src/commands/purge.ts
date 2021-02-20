import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import TextChannel from "../struct/discord/TextChannel"

export default new Command({
    name: "purge",
    aliases: ["prune", "bulkdelete"],
    description: "Bulk-delete messages in a channel.",
    permission: [Roles.MODERATOR, Roles.MANAGER],
    usage: "<amount>",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const amount = Number(args.consume())
        if (Number.isNaN(amount))
            return message.channel.sendError("You must provide a valid amount!")

        const purged = await (message.channel as TextChannel).bulkDelete(amount, true)
        await message.channel.sendSuccess(`Purged ${purged.size} messages.`)
        await client.log({
            color: client.config.colors.info,
            author: { name: "Purge" },
            description: `${purged.size} messages purged by ${message.author} in ${message.channel}.`
        })
    }
})
