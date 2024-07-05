import Discord, { ButtonInteraction } from "discord.js"
import Client from "../struct/Client.js"
import CommandMessage from "../struct/CommandMessage.js"
import TimedPunishment from "../entities/TimedPunishment.entity.js"
import ActionLog from "../entities/ActionLog.entity.js"
import GuildMember from "../struct/discord/GuildMember.js"
import { noop } from "@buildtheearth/bot-utils"

async function log(
    client: Client,
    message: CommandMessage | ButtonInteraction,
    user: Discord.User,
    type: "warn" | "mute" | "kick" | "ban",
    reason: string,
    image: string | null,
    length: number | null,
    punishment: TimedPunishment | null,
    messageId: string = message.id
): Promise<ActionLog> {
    const log = new ActionLog()

    log.action = type
    log.member = user.id
    if (message.member) log.executor = message.member.user.id
    log.reason = reason
    if (image) log.reasonImage = image
    log.length = length
    if (message instanceof ButtonInteraction) log.channel = message.channelId
    else log.channel = message.channel.id
    log.message = messageId
    if ((type === "ban" || type === "mute") && punishment) log.punishment = punishment
    await log.save()

    const memberTemp = await message.guild?.members
        .fetch({ user, cache: true })
        .catch(noop)

    const member: Discord.GuildMember | null = memberTemp || null

    await log.notifyMember(client)
    if (type === "ban") {
        const reviewerChannel = client.customGuilds
            .main()
            .channels.cache.find(
                ch => ch.name == "review-committee-private"
            ) as Discord.TextChannel
        if (
            member &&
            GuildMember.hasRole(member, globalThis.client.roles.BUILDER, client) &&
            reviewerChannel
        )
            await client.response.sendSuccess(
                reviewerChannel,
                `Builder ${member.user} (${member.id}) was banned!`
                //no need to translate this
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
    length: number | null
) {
    const punishment = new TimedPunishment()
    punishment.member = member.id
    punishment.type = type
    punishment.length = length || 0
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
    image: string | null,
    length: number | null,
    messageId: string = message.id
): Promise<ActionLog> {
    let punishment: TimedPunishment | null
    if (type === "ban" || type === "mute") {
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
