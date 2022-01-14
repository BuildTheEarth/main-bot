import Discord from "discord.js"
import Client from "../struct/Client"
import CommandMessage from "../struct/CommandMessage"
import TimedPunishment from "../entities/TimedPunishment"
import ActionLog from "../entities/ActionLog"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles"

async function log(
    client: Client,
    message: CommandMessage,
    member: Discord.GuildMember,
    type: "warn" | "mute" | "kick" | "ban",
    reason: string,
    image: string,
    length: number,
    punishment: TimedPunishment
) {
    const log = new ActionLog()
    log.action = type
    log.member = member.id
    log.executor = message.member.id
    log.reason = reason
    log.reasonImage = image
    log.length = length
    log.channel = message.channel.id
    log.message = message.id
    if (type === ("ban" || "mute")) log.punishment = punishment
    await log.save()

    await log.notifyMember(client)
    if (type === "ban") {
        const reviewerChannel = message.guild.channels.cache.find(
            ch => ch.name == "review-committee-private"
        ) as Discord.TextChannel
        if (member && GuildMember.hasRole(member, Roles.BUILDER) && reviewerChannel)
            client.response.sendSuccess(
                reviewerChannel,
                `Builder ${member.user} (${member.id}) was banned!`
            )
        await message.guild.members.ban(member.user, {
            reason: reason.length <= 512 ? reason : (await log.contextUrl(client)).href
        })
    }
    if (type === "mute") {
        if (member) await GuildMember.mute(member, reason)
    }
    if (type === "kick") {
        await member.kick(
            reason.length <= 512 ? reason : (await log.contextUrl(client)).href
        )
    }

    return log
}

async function timedPunishment(
    client: Client,
    member: Discord.GuildMember,
    type: "mute" | "ban",
    length: number
) {
    const punishment = new TimedPunishment()
    punishment.member = member.id
    punishment.type = type
    punishment.length = length
    await punishment.save()
    punishment.schedule(client)

    return punishment
}

export default async function punish(
    client: Client,
    message: CommandMessage,
    member: Discord.GuildMember,
    type: "warn" | "mute" | "kick" | "ban",
    reason: string,
    image: string,
    length: number
): Promise<ActionLog> {
    let punishment
    if (type === ("ban" || "mute")) {
        punishment = await timedPunishment(client, member, type, length)
    } else punishment = null
    return await log(client, message, member, type, reason, image, length, punishment)
}
