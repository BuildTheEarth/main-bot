import Discord from "discord.js"
import Client from "../Client"
import Guild from "./Guild"
import Roles from "../../util/roles"

export default class GuildMember extends Discord.GuildMember {
    client: Client
    guild: Guild

    hasStaffPermission(roles: string | string[]): boolean {
        if (roles === Roles.ANY) return true
        if (typeof roles === "string") roles = [roles]
        roles.push(Roles.BOT_DEVELOPER)
        for (const role of roles)
            if (this.roles.cache.find(r => r.name === role)) return true
        return false
    }

    async mute(reason: string): Promise<this> {
        await this.roles.add(this.guild.role(Roles.MUTED), reason)
        return this
    }

    async unmute(reason: string): Promise<this> {
        await this.roles.remove(this.guild.role(Roles.MUTED), reason)
        return this
    }
}
