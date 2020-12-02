import Discord from "discord.js"
import Client from "../Client"
import Guild from "./Guild"

export default class GuildMember extends Discord.GuildMember {
    client: Client
    guild: Guild

    hasStaffPermission(roles: string | string[]) {
        if (roles === "Any") return true
        if (typeof roles === "string") roles = [roles]
        for (const role of roles)
            if (this.roles.cache.find(r => r.name === role)) return true
        return false
    }

    async mute(reason: string): Promise<this> {
        await this.roles.add(this.guild.muteRole, reason)
        return this
    }

    async unmute(reason: string): Promise<this> {
        await this.roles.remove(this.guild.muteRole, reason)
        return this
    }
}
