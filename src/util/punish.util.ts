import { ButtonInteraction, ContextMenuCommandInteraction, GuildMember, TextChannel, User } from "discord.js"
import BotClient from "../struct/BotClient.js"
import CommandMessage from "../struct/CommandMessage.js"
import TimedPunishment from "../entities/TimedPunishment.entity.js"
import ActionLog from "../entities/ActionLog.entity.js"
import BotGuildMember from "../struct/discord/BotGuildMember.js"
import { noop } from "@buildtheearth/bot-utils"

async function log(
    client: BotClient,
    message: CommandMessage | ButtonInteraction | ContextMenuCommandInteraction,
    user: User,
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
    else if (message instanceof ContextMenuCommandInteraction) log.channel = message.channelId
    else log.channel = message.channel.id
    log.message = messageId
    if ((type === "ban" || type === "mute") && punishment) log.punishment = punishment
    await log.save()

    const memberTemp = await message.guild?.members
        .fetch({ user, cache: true })
        .catch(noop)

    const member: GuildMember | null = memberTemp || null

    await log.notifyMember(client)
    if (type === "ban") {
        const reviewerChannel = client.customGuilds
            .main()
            .channels.cache.find(
                ch => ch.name == "builder-council"
            ) as TextChannel
        if (
            member &&
            BotGuildMember.hasRole(member, globalThis.client.roles.BUILDER, client) &&
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
        if (member) await BotGuildMember.mute(member, reason)
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
    client: BotClient,
    member: User,
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
    client: BotClient,
    message: CommandMessage | ButtonInteraction | ContextMenuCommandInteraction,
    member: User,
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
