import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles"

export default async function guildMemberUpdate(
    this: Client,
    oldMember: GuildMember,
    newMember: GuildMember
): Promise<void> {
    if (newMember.guild.id === this.config.guilds.youtube) {
        const main = this.guilds.cache.get(this.config.guilds.main)
        const mainMember: GuildMember = await main.members
            .fetch({ user: newMember })
            .catch(() => null)
        if (!mainMember) return

        const mainRole = main.roles.cache.find(
            role => role.name === Roles.PIPPEN_YOUTUBE_GROUP
        )

        const was = oldMember.hasStaffPermission(Roles.YOUTUBE)
        const is = newMember.hasStaffPermission(Roles.YOUTUBE)

        if (was && !is) mainMember.roles.remove(mainRole).catch(() => null)
        else if (is && !was) mainMember.roles.add(mainRole).catch(() => null)
    }
}
