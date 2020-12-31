import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import Roles from "../util/roles"

export default async function guildMemberRemove(
    this: Client,
    member: GuildMember
): Promise<void> {
    if (member.guild.id === this.config.guilds.youtube) {
        const main = this.guilds.cache.get(this.config.guilds.main)
        const mainMember: GuildMember = await main.members
            .fetch({ user: member.user, cache: true })
            .catch(() => null)
        if (!mainMember) return
        const mainRole = main.roles.cache.find(
            role => role.name === Roles.PIPPEN_YOUTUBE_GROUP
        )

        mainMember.roles.remove(mainRole).catch(() => null)
    }
}
