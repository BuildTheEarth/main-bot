import Discord from "discord.js"
import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import TimedPunishment from "../entities/TimedPunishment"
import Command from "../struct/Command"
import Roles from "../util/roles"
import formatPunishmentTime from "../util/formatPunishmentTime"
import ms from "ms"

export default new Command({
    name: "mute",
    aliases: [],
    description: "Mute a member.",
    permission: [Roles.HELPER, Roles.MODERATOR],
    usage: "<member> <length> <reason>",
    async run(client: Client, message: Discord.Message, args: string) {
        const targetTag = args.match(/.{2,32}#\d{4}/)?.[0]
        const targetID = args.match(/\d{18}/)?.[0]
        const target = <GuildMember>(
            (targetID
                ? await message.guild.members.fetch({ user: targetID, cache: true })
                : message.guild.members.cache.find(m => m.user.tag === targetTag))
        )
        if (targetID) args = args.split(" ").slice(1).join(" ").trim()
        else args = args.replace(targetTag, "").trim()

        if (!target) {
            return message.channel.send({
                embed: {
                    color: client.config.colors.error,
                    description: `Couldn't find user \`${targetTag || targetID}\``
                }
            })
        }

        if (target.hasStaffPermission(Roles.STAFF)) {
            const error =
                target.id === message.author.id
                    ? "You can't mute yourself..."
                    : "You can't mute other staff!"
            return message.channel.send({
                embed: {
                    color: client.config.colors.error,
                    description: error
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
