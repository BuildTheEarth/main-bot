import BotClient from "../struct/BotClient.js"
import BotGuildMember from "../struct/discord/BotGuildMember.js"
import { GuildMember } from "discord.js"
import TimedPunishment from "../entities/TimedPunishment.entity.js"

export default async function guildMemberAdd(
    this: BotClient,
    member: GuildMember
): Promise<void> {
    const mute = await TimedPunishment.findOne({ member: member.id })
    if (mute) BotGuildMember.mute(member, "Mute on re-join")
}
