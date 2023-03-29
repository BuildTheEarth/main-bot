import Discord from "discord.js"

export default class Guild {
    static async member(
        guild: Discord.Guild,
        user: Discord.UserResolvable
    ): Promise<Discord.GuildMember> {
        return (await guild.members.fetch(user)) as Discord.GuildMember
    }

    static role(guild: Discord.Guild, name: string[]): Discord.Role {
        return (
            guild?.roles?.cache?.find(role => name.includes(role.id)) ||
            guild.roles.highest
        )
    }

    static roleByName(guild: Discord.Guild, name: string): Discord.Role {
        return (
            guild?.roles?.cache?.find(role => name === role.name) || guild.roles.highest
        )
    }

    static async setVanityCode(
        guild: Discord.Guild,
        code: string,
        reason?: string
    ): Promise<void> {
        await guild.client.rest.patch(`/guilds/${guild.id}/vanity-url`, { body: {code}, reason})
    }
}
