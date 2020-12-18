import Discord from "discord.js"
import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import ActionLog, { Action } from "../entities/ActionLog"
import TimedPunishment from "../entities/TimedPunishment"
import ModerationNote from "../entities/ModerationNote"
import { FindManyOptions, Not, IsNull } from "typeorm"

export default new Command({
    name: "check",
    aliases: ["history", "logs", "records"],
    description: "Check a user's punishment records.",
    permission: [Roles.HELPER, Roles.MODERATOR, Roles.MANAGER],
    usage: "<user> ['deleted']",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const user = await args.consumeUser()
        const showDeleted = args.consume().toLowerCase() === "deleted"

        if (!user)
            return message.channel.sendError(
                user === undefined
                    ? "You must provide a user to check!"
                    : "Couldn't find that user."
            )

        const criteria: FindManyOptions = { where: { member: user.id } }
        if (showDeleted) {
            // @ts-ignore: Property 'deletedAt' does not exist on type 'string'.
            criteria.where.deletedAt = Not(IsNull())
            criteria.withDeleted = true
        }

        const actionLogs = await ActionLog.find(criteria)
        const categorizedLogs: Record<Action, ActionLog[]> = {
            warn: [],
            mute: [],
            kick: [],
            ban: [],
            unmute: [],
            unban: []
        }

        const clean = !actionLogs.length
        for (const log of actionLogs) categorizedLogs[log.action].push(log)

        const embed: Discord.MessageEmbedOptions = {
            thumbnail: {
                url: user.displayAvatarURL({ size: 64, format: "png", dynamic: true })
            },
            fields: []
        }

        if (clean) {
            embed.description = `✨ No cases found for ${user} (${user.tag}).`
        } else {
            const current = await TimedPunishment.findOne({ where: { member: user.id } })
            const currentLog = actionLogs.find(log => log.punishment?.id === current?.id)
            const adjective = current?.type === "mute" ? "muted" : "banned"
            const cases = showDeleted ? "Deleted cases" : "Cases"
            const attribute = showDeleted ? " deleted " : " "

            embed.description =
                current && currentLog
                    ? `${user} (${user.tag}) is currently ${adjective} (**#${currentLog.id}**). Here are their${attribute}cases:`
                    : `${cases} for ${user} (${user.tag}):`
            if (actionLogs.some(log => log.old))
                embed.description += "\n(Cases older than 3 months are marked with \\📜)."

            for (const [action, logs] of Object.entries(categorizedLogs)) {
                const actionTitle = action[0].toUpperCase() + action.slice(1) + "s"
                const name = `${actionTitle} (${logs.length})`
                const value = logs.map(log => log.format()).join("\n") || "\u200B"
                embed.fields.push({ name, value, inline: true })
            }
        }

        const notes = await ModerationNote.findOne({ where: { member: user.id } })
        if (notes) embed.fields.push({ name: "Notes", value: notes.body, inline: true })

        await message.channel.sendSuccess(embed)
    }
})
