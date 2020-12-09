import Discord from "discord.js"
import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import ActionLog, { Action } from "../entities/ActionLog"
import TimedPunishment from "../entities/TimedPunishment"

export default new Command({
    name: "check",
    aliases: ["history", "logs", "records"],
    description: "Check a user's punishment records.",
    permission: [Roles.HELPER, Roles.MODERATOR],
    usage: "<user> [deleted]",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const user = await args.consumeUser()
        const showDeleted = args.consume().toLowerCase() === "deleted"

        if (!user)
            return message.channel.sendError(
                user === undefined
                    ? "You must provide a user to check!"
                    : "Couldn't find that user."
            )

        const actionLogs = await ActionLog.find({
            where: { member: user.id },
            withDeleted: showDeleted
        })
        // prettier-ignore
        const categorizedLogs: Record<Action, ActionLog[]> =
            { warn: [], mute: [], kick: [], ban: [], unmute: [], unban: [] }

        const clean = !actionLogs.length
        for (const log of actionLogs) categorizedLogs[log.action].push(log)

        const embed: Discord.MessageEmbedOptions = {
            thumbnail: {
                url: user.displayAvatarURL({ size: 64, format: "png", dynamic: true })
            },
            fields: []
        }

        if (clean) {
            embed.description = `✨ No punishment logs found for ${user} (${user.tag}).`
        } else {
            const punishment = await TimedPunishment.findOne({
                where: { member: user.id }
            })
            const adjective = punishment?.type === "mute" ? "muted" : "banned"
            const log = actionLogs.find(log => log.punishment?.id === punishment?.id)

            embed.description = punishment
                ? `${user} (${user.tag}) is currently ${adjective} (**#${log.id}**). Here are their punishment logs:`
                : `Punishment logs for ${user} (${user.tag}):`
            for (const [action, logs] of Object.entries(categorizedLogs)) {
                const actionTitle = action[0].toUpperCase() + action.slice(1) + "s"
                const nonDeletedLogs = logs.filter(log => !log.deletedAt)
                const name = `${actionTitle} (${nonDeletedLogs.length})`
                const value = logs.map(log => log.format()).join("\n") || "\u200B"
                embed.fields.push({ name, value, inline: true })
            }
        }

        message.channel.sendSuccess(embed)
    }
})
