import Discord from "discord.js"
import Client from "../struct/Client"
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
    async run(this: Command, client: Client, message: Discord.Message, args: string) {
        const id = Number(args.split(" ")[0])
        if (Number.isNaN(id)) {
            return message.channel.send({
                embed: {
                    color: client.config.colors.error,
                    description: "You must provide a case ID!"
                }
            })
        }

        const log = await ActionLog.findOne(id)

        if (!log) {
            return message.channel.send({
                embed: {
                    color: client.config.colors.error,
                    description: `Couldn't find case with ID \`${id}\`.`
                }
            })
        }

        const messageLink = `https://discord.com/channels/${client.config.guilds.main}/${log.channel}/${log.message}`
        // i'm so sorry
        const timestamp = `${log.timestamp.getUTCDate()}/${log.timestamp.getUTCMonth()}/${log.timestamp.getUTCFullYear()} @ ${log.timestamp.getUTCHours()}:${log.timestamp.getUTCMinutes()}:${log.timestamp.getUTCSeconds()} UTC`
        const embed = {
            color: client.config.colors.success,
            author: { name: `Case #${log.id} (${log.action})` },
            fields: [
                { name: "Member", value: `<@${log.member}>`, inline: true },
                { name: "Reason", value: log.reason, inline: true },
                { name: "Moderator", value: `<@${log.executor}>`, inline: true },
                { name: "Context", value: `[Link](${messageLink})`, inline: true },
                { name: "Time", value: timestamp, inline: true }
            ]
        }

        if (log.length)
            embed.fields.splice(1, 0, {
                name: "Length",
                value: ms(log.length, { long: true }),
                inline: true
            })

        message.channel.send({ embed })
    }
})
