import Discord, { ButtonInteraction } from "discord.js"
import Client from "../struct/Client"
import CommandMessage from "../struct/CommandMessage"
import TimedPunishment from "../entities/TimedPunishment.entity"
import ActionLog from "../entities/ActionLog.entity"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "./roles.util"
import noop from "./noop.util"

async function log(
    client: Client,
    message: CommandMessage | ButtonInteraction,
    user: Discord.User,
    type: "warn" | "mute" | "kick" | "ban",
    reason: string,
    image: string,
    length: number,
    punishment: TimedPunishment,
    messageId: string = message.id
): Promise<ActionLog> {
    const log = new ActionLog()
    log.action = type
    log.member = user.id
    log.executor = message.member.user.id
    log.reason = reason
    log.reasonImage = image
    log.length = length
    if (message instanceof ButtonInteraction) log.channel = message.channelId
    else log.channel = message.channel.id
    log.message = messageId
    if (type === ("ban" || "mute")) log.punishment = punishment
    await log.save()

    const member: Discord.GuildMember = await message.guild.members
        .fetch({ user, cache: true })
        .catch(noop)

    await log.notifyMember(client)
    if (type === "ban") {
        const reviewerChannel = client.customGuilds
            .main()
            .channels.cache.find(
                ch => ch.name == "review-committee-private"
            ) as Discord.TextChannel
        if (
            member &&
            GuildMember.hasRole(member, Roles.BUILDER, client) &&
            reviewerChannel
        )
            await client.response.sendSuccess(
                reviewerChannel,
                `Builder ${member.user} (${member.id}) was banned!`
            )
        await client.customGuilds.main().members.ban(user, {
            reason: reason.length <= 512 ? reason : (await log.contextUrl(client)).href
        })
    }
    if (type === "mute") {
        if (member) await GuildMember.mute(member, reason)
    }
    if (type === "kick") {
        if (member)
            await member.kick(
                reason.length <= 512 ? reason : (await log.contextUrl(client)).href
            )
    }

    return log
}

async function timedPunishment(
    client: Client,
    member: Discord.User,
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
    message: CommandMessage | ButtonInteraction,
    member: Discord.User,
    type: "warn" | "mute" | "kick" | "ban",
    reason: string,
    image: string,
    length: number,
    messageId: string = message.id
): Promise<ActionLog> {
    let punishment: TimedPunishment
    if (type === ("ban" || "mute")) {
        punishment = await timedPunishment(client, member, type, length)
    } else punishment = null

    const actionLog = await log(
        client,
        message,
        member,
        type,
        reason,
        image,
        length,
        punishment,
        messageId
    )

    return actionLog
}
