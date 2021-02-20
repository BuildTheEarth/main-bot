import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import noop from "../util/noop"
import Roles from "../util/roles"

export default async function guildMemberRemove(
    this: Client,
    member: GuildMember
): Promise<void> {
    if (member.guild.id === this.config.guilds.youtube) {
        const main = this.guilds.cache.get(this.config.guilds.main)
        const mainMember: GuildMember = await main.members
            .fetch({ user: member.user, cache: true })
            .catch(noop)
        if (!mainMember) return
        const mainRole = main.role(Roles.PIPPEN_YOUTUBE_GROUP)

        mainMember.roles.remove(mainRole).catch(noop)
    }
}
