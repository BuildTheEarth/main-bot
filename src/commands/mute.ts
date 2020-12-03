import ms from "ms"
import Discord from "discord.js"
import Client from "../struct/Client"
import Guild from "../struct/discord/Guild"
import TimedPunishment from "../entities/TimedPunishment"
import Command from "../struct/Command"
import Roles from "../util/roles"
import formatPunishmentTime from "../util/formatPunishmentTime"

export default new Command({
    name: "mute",
    aliases: [],
    description: "Mute a member.",
    permission: [Roles.HELPER, Roles.MODERATOR],
    usage: "<member> <length> <reason>",
    async run(client: Client, message: Discord.Message, args: string) {
        const result = await (<Guild>message.guild).members.find(args)
        args = result.args
        const target = result.member

        if (!target) {
            return message.channel.send({
                embed: {
                    color: client.config.colors.error,
                    description:
                        target === undefined
                            ? `Couldn't find user \`${result.input}\`.`
                            : `You must provide a user to mute!`
                }
            })
        }

        if (target.hasStaffPermission(Roles.STAFF)) {
            return message.channel.send({
                embed: {
                    color: client.config.colors.error,
                    description:
                        target.id === message.author.id
                            ? "You can't mute yourself..."
                            : "You can't mute other staff!"
                }
            })
        }

        const length = ms(args.split(" ")[0]) || Infinity
        const reason = args.split(" ").slice(1).join(" ").trim()
        const punishment = new TimedPunishment()
        punishment.user = target.id
        punishment.type = "mute"
        punishment.end = Date.now() + length

        await target.mute(reason)
        await punishment.save()
        setTimeout(async () => {
            await punishment.undo(this)
            await punishment.remove()
        }, length)

        const formattedLength = formatPunishmentTime(length)

        message.channel.send({
            embed: {
                color: client.config.colors.success,
                description: `Muted \`${target.user.tag}\` ${formattedLength} • *${reason}*`
            }
        })

        target.user.send({
            embed: {
                color: client.config.colors.error,
                description: `${message.author} has muted you ${formattedLength}:\n\n*${reason}*`
            }
        })
    }
})
