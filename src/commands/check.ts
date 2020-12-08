import Discord from "discord.js"
import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import ActionLog from "../entities/ActionLog"

export default new Command({
    name: "check",
    aliases: ["history", "logs", "records"],
    description: "Check a user's punishment records.",
    permission: [Roles.HELPER, Roles.MODERATOR],
    usage: "<user>",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const user = await args.consumeUser()

        if (!user)
            return message.channel.sendError(
                user === undefined
                    ? "You must provide a user to check!"
                    : "Couldn't find that user."
            )

        const actionLogs = await ActionLog.find({ where: { member: user.id } })
        const categorizedLogs: {
            [key: string]: ActionLog[]
        } = { warn: [], mute: [], kick: [], ban: [], unmute: [], unban: [] }

        const clean = !actionLogs.length
        for (const log of actionLogs) categorizedLogs[log.action].push(log)

        const embed: Discord.MessageEmbedOptions = {
            thumbnail: { url: user.displayAvatarURL({ size: 64, format: "png" }) },
            fields: []
        }

        if (clean) {
            embed.description = `✨ No punishment logs found for ${user}.`
        } else {
            embed.description = `Punishment logs for ${user}:`
            for (const [action, logs] of Object.entries(categorizedLogs)) {
                // prettier-ignore
                const name = `${action[0].toUpperCase() + action.slice(1) + "s"} (${logs.length})`
                // prettier-ignore
                const value = logs.map(log => `\` ${log.id}. \` ${log.reason}`).join("\n") || "\u200B"
                embed.fields.push({ name, value, inline: true })
            }
        }

        message.channel.sendSuccess(embed)
    }
})
