import Client from "../struct/Client.js"
import GuildMember from "../struct/discord/GuildMember.js"
import Discord from "discord.js"
import TimedPunishment from "../entities/TimedPunishment.entity.js"

export default async function guildMemberAdd(
    this: Client,
    member: Discord.GuildMember
): Promise<void> {
    const mute = await TimedPunishment.findOne({ member: member.id })
    if (mute) GuildMember.mute(member, "Mute on re-join")
}
