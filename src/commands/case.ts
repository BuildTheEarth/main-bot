import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import ActionLog from "../entities/ActionLog"
import Roles from "../util/roles"

export default new Command({
    name: "case",
    aliases: ["log", "record"],
    description: "Check specific info on a case.",
    permission: [Roles.HELPER, Roles.MODERATOR],
    usage: "<id>",
    subcommands: [
        {
            name: "edit",
            description: "Edit a case.",
            permission: [Roles.HELPER, Roles.MODERATOR],
            usage: "<id> <new reason>"
        },
        {
            name: "delete",
            description: "Delete a case.",
            permission: Roles.MODERATOR,
            usage: "<id> <reason>"
        }
    ],
    async run(this: Command, client: Client, message: Message, args: Args) {
        const subcommand = args.consume().toLowerCase()

        const id = ["edit", "delete"].includes(subcommand)
            ? Number(args.consume())
            : Number(subcommand)
        if (Number.isNaN(id))
            return message.channel.sendError("You must provide a case ID!")

        const log = await ActionLog.findOne(id, { withDeleted: true })
        if (!log) return message.channel.sendError(`Couldn't find case **#${id}**.`)

        if (!["edit", "delete"].includes(subcommand)) {
            const embed = log.displayEmbed(client)
            await message.channel.send({ embed })
        } else if (subcommand === "edit") {
            const reason = args.consumeRest()
            if (!reason)
                return message.channel.sendError("You must provide a new reason!")

            log.reason = reason
            await log.save()
            return message.channel.sendSuccess(`Edited case **#${id}**.`)
        } else if (subcommand === "delete") {
            if (!message.member.hasStaffPermission(Roles.MODERATOR)) return
            const reason = args.consumeRest()
            if (!reason)
                return message.channel.sendError("You must provide a deletion reason!")

            log.deleter = message.author.id
            log.deleteReason = reason
            await log.save()
            await log.softRemove()
            await message.channel.sendSuccess(`Deleted case **#${id}**.`)
        }
    }
})
