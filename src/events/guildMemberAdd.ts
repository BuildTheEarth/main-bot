import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import Discord from "discord.js"
import TimedPunishment from "../entities/TimedPunishment"

export default async function guildMemberAdd(
    this: Client,
    member: Discord.GuildMember
): Promise<void> {
    const mute = await TimedPunishment.findOne({ member: member.id })
    if (mute) GuildMember.mute(member, "Mute on re-join")
}
