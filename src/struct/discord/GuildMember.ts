import Discord from "discord.js"
import Guild from "./Guild"
import Roles from "../../util/roles"

export default class GuildMember {
    static hasRole(
        user: Discord.GuildMember,
        roles: string | string[],
        botDevBypass = true
    ): boolean {
        if (roles === Roles.ANY) return true
        if (typeof roles === "string") roles = [roles]
        if (botDevBypass) roles.push(Roles.BOT_DEVELOPER)
        for (const role of roles)
            if (user.roles.cache.find(r => r.name === role)) return true
        return false
    }

    static async mute(
        user: Discord.GuildMember,
        reason: string
    ): Promise<Discord.GuildMember> {
        await user.roles.add(Guild.role(user.guild, Roles.MUTED), reason)
        return user
    }

    static async unmute(
        user: Discord.GuildMember,
        reason: string
    ): Promise<Discord.GuildMember> {
        await user.roles.remove(Guild.role(user.guild, Roles.MUTED), reason)
        return user
    }
}
