import Discord from "discord.js"
import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Command from "../struct/Command"
import ActionLog from "../entities/ActionLog"
import formatPunishmentTime from "../util/formatPunishmentTime"
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
            usage: "<id> <reason>"
        },
        {
            name: "delete",
            description: "Delete a case.",
            permission: Roles.MODERATOR,
            usage: "<id>"
        }
    ],
    async run(this: Command, client: Client, message: Message, args: string) {
        const subcommand = args.split(/ +/)[0].toLowerCase()
        args = args.split(" ").slice(1).join(" ").trim()

        const id = ["edit", "delete"].includes(subcommand)
            ? Number(args.split(" ")[0])
            : Number(subcommand)
        if (Number.isNaN(id))
            return message.channel.sendError("You must provide a case ID!")

        const log = await ActionLog.findOne(id, { withDeleted: true })
        if (!log) return message.channel.sendError(`Couldn't find case **#${id}**.`)

        if (!["edit", "delete"].includes(subcommand)) {
            const messageLink = `https://discord.com/channels/${client.config.guilds.main}/${log.channel}/${log.message}`
            // i'm so sorry
            const time = log.createdAt
            const timestamp = `${time.getUTCDate()}/${time.getUTCMonth()}/${time.getUTCFullYear()} @ ${time.getUTCHours()}:${time.getUTCMinutes()}:${time.getUTCSeconds()} UTC`
            const embed: Discord.MessageEmbedOptions = {
                author: { name: `Case #${log.id} (${log.action})` },
                fields: [
                    { name: "Member", value: `<@${log.member}>` },
                    { name: "Reason", value: log.reason },
                    { name: "Moderator", value: `<@${log.executor}>` },
                    { name: "Context", value: `[Link](${messageLink})` },
                    { name: "Time", value: timestamp }
                ].map(field => ({ ...field, inline: true }))
            }

            if (log.length !== null)
                embed.fields.splice(1, 0, {
                    name: "Length",
                    value: formatPunishmentTime(log.length, true),
                    inline: true
                })

            if (log.deletedAt) {
                embed.description = "*This case has been deleted.*"
                return message.channel.sendError(embed)
            }

            if (log.punishment?.end > new Date()) {
                const end = log.punishment.end.getTime() - Date.now()
                embed.description = `*Ending in ${formatPunishmentTime(end, true)}.*`
            }

            message.channel.sendSuccess(embed)
        } else if (subcommand === "edit") {
            const reason = args.split(" ").slice(1).join(" ").trim()
            if (!reason)
                return message.channel.sendError("You must provide a new reason!")
            log.reason = reason
            await log.save()
            return message.channel.sendSuccess(`Edited case **#${id}**.`)
        } else if (subcommand === "delete") {
            if (!message.member.hasStaffPermission(Roles.MODERATOR)) return
            await log.softRemove()
            await message.channel.sendSuccess(`Deleted case **#${id}**.`)
        }
    }
})
