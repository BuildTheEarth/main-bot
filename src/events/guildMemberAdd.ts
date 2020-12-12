import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import TimedPunishment from "../entities/TimedPunishment"

export default async function guildMemberAdd(this: Client, member: GuildMember) {
    const mute = await TimedPunishment.findOne({ where: { member: member.id } })
    if (mute && mute.end > new Date()) member.mute("Mute on re-join")
}
