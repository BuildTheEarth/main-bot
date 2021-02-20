import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles"
import noop from "../util/noop"

export default async function guildMemberUpdate(
    this: Client,
    oldMember: GuildMember,
    newMember: GuildMember
): Promise<void> {
    if (newMember.guild.id === this.config.guilds.youtube) {
        const mainMember: GuildMember = await this.guilds.main.members
            .fetch({ user: newMember.user, cache: true })
            .catch(noop)
        if (!mainMember) return

        const mainRole = this.guilds.main.role(Roles.PIPPEN_YOUTUBE_GROUP)
        const was = oldMember.hasRole(Roles.YOUTUBE)
        const is = newMember.hasRole(Roles.YOUTUBE)

        if (was && !is) mainMember.roles.remove(mainRole).catch(noop)
        else if (is && !was) mainMember.roles.add(mainRole).catch(noop)
    }
}
