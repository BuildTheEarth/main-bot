import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import ActionLog from "../entities/ActionLog"
import Roles from "../util/roles"
import GuildMember from "../struct/discord/GuildMember"
import Discord from "discord.js"

export default new Command({
    name: "case",
    aliases: ["log", "record"],
    description: "Check specific info on a case.",
    permission: [Roles.HELPER, Roles.MODERATOR, Roles.MANAGER],
    usage: "<id>",
    subcommands: [
        {
            name: "edit",
            description: "Edit a case.",
            permission: [Roles.HELPER, Roles.MODERATOR, Roles.MANAGER],
            usage: "<id> [image URL | attachment] <new reason>"
        },
        {
            name: "delete",
            description: "Delete a case.",
            permission: [Roles.MODERATOR, Roles.MANAGER],
            usage: "<id> <reason>"
        }
    ],
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const subcommand = args.consumeIf(["edit", "delete"])
        const id = Number(args.consume())
        if (Number.isNaN(id))
            return client.channel.sendError(
                message.channel,
                "You must provide a case ID!"
            )

        const log = await ActionLog.findOne(id, { withDeleted: true })
        if (!log)
            return client.channel.sendError(
                message.channel,
                `Couldn't find case **#${id}**.`
            )

        if (!["edit", "delete"].includes(subcommand)) {
            const embed = log.displayEmbed(client)
            await message.channel.send({ embeds: [embed] })
        } else if (subcommand === "edit") {
            const image = args.consumeImage()
            const reason = args.consumeRest()
            if (!reason && !image)
                return client.channel.sendError(
                    message.channel,
                    "You must provide a new reason/image!"
                )
            if (reason === log.reason && !image)
                return client.channel.sendError(message.channel, "Nothing changed.")

            if (image) log.reasonImage = image
            if (reason) log.reason = reason
            await log.save()
            await log.updateNotification(client)
            await client.channel.sendError(message.channel, `Edited case **#${id}**.`)
            await client.log(log)
        } else if (subcommand === "delete") {
            if (!GuildMember.hasRole(message.member, Roles.MODERATOR)) return
            const reason = args.consumeRest()
            if (!reason)
                return client.channel.sendError(
                    message.channel,
                    "You must provide a deletion reason!"
                )
            if (log.deletedAt)
                return client.channel.sendError(
                    message.channel,
                    "That case is already deleted!"
                )

            log.deletedAt = new Date()
            log.deleter = message.author.id
            log.deleteReason = reason
            await log.save()
            await client.channel.sendSuccess(message.channel, `Deleted case **#${id}**.`)
            await client.log(log)
        }
    }
})
