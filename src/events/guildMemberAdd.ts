import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import TimedPunishment from "../entities/TimedPunishment"

export default async function guildMemberAdd(
    this: Client,
    member: GuildMember
): Promise<void> {
    if (member.guild.id === this.config.guilds.youtube) return
    const mute = await TimedPunishment.findOne({ member: member.id })
    if (mute) member.mute("Mute on re-join")
}
