import Discord from "discord.js"

export default class GuildMember extends Discord.GuildMember {
    hasStaffPermission(roles: string | string[]) {
        if (roles === "any") return true
        if (typeof roles === "string") roles = [roles]
        for (const role of roles)
            if (this.roles.cache.find(r => r.name === role)) return true
        return false
    }
}
