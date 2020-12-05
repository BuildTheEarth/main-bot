import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Command from "../struct/Command"
import Roles from "../util/roles"
import ActionLog from "../entities/ActionLog"
import ms from "ms"

export default new Command({
    name: "case",
    aliases: ["log", "record"],
    description: "Check specific info on a case.",
    permission: [Roles.HELPER, Roles.MODERATOR],
    usage: "<id>",
    async run(this: Command, client: Client, message: Message, args: string) {
        const id = Number(args.split(" ")[0])
        if (Number.isNaN(id))
            return message.channel.sendError("You must provide a case ID!")

        const log = await ActionLog.findOne(id)
        if (!log)
            return message.channel.sendError(`Couldn't find case with ID \`${id}\`.`)

        const messageLink = `https://discord.com/channels/${client.config.guilds.main}/${log.channel}/${log.message}`
        // i'm so sorry
        const timestamp = `${log.timestamp.getUTCDate()}/${log.timestamp.getUTCMonth()}/${log.timestamp.getUTCFullYear()} @ ${log.timestamp.getUTCHours()}:${log.timestamp.getUTCMinutes()}:${log.timestamp.getUTCSeconds()} UTC`
        const embed = {
            author: { name: `Case #${log.id} (${log.action})` },
            fields: [
                { name: "Member", value: `<@${log.member}>` },
                { name: "Reason", value: log.reason },
                { name: "Moderator", value: `<@${log.executor}>` },
                { name: "Context", value: `[Link](${messageLink})` },
                { name: "Time", value: timestamp }
            ].map(f => ({ ...f, inline: true }))
        }

        if (log.length)
            embed.fields.splice(1, 0, {
                name: "Length",
                value: ms(log.length, { long: true }),
                inline: true
            })

        message.channel.sendSuccess(embed)
    }
})
