import Discord from "discord.js"
import Guild from "./Guild"
import Roles from "../../util/roles"
import Client from "../Client"

export default class GuildMember {
    static hasRole(
        user: Discord.GuildMember,
        roles: string | string[],
        client: Client,
        botDevBypass = true
    ): boolean {
        if (roles === Roles.ANY) return true
        if (typeof roles === "string") roles = [roles]
        if (botDevBypass && client.config.developers.includes(user.id)) return true
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

    static async addRole(
        user: Discord.GuildMember,
        roles: string | string[],
        reason: string
    ): Promise<Discord.GuildMember> {
        if (typeof roles === "string") roles = [roles]
        for (const role of roles) {
            await user.roles.add(Guild.role(user.guild, role), reason)
        }
        return user
    }

    static async removeRole(
        user: Discord.GuildMember,
        roles: string | string[],
        reason: string
    ): Promise<Discord.GuildMember> {
        if (typeof roles === "string") roles = [roles]
        for (const role of roles) {
            await user.roles.remove(Guild.role(user.guild, role), reason)
        }
        return user
    }

    static async toggleRole(
        user: Discord.GuildMember,
        roles: string | string[],
        reason: string,
        client: Client
    ): Promise<boolean> {
        if (typeof roles === "string") roles = [roles]
        const shouldAdd: boolean[] = []
        for (const role of roles) {
            shouldAdd.push(!GuildMember.hasRole(user, role, client, false))
        }
        if (shouldAdd.includes(false)) {
            for await (const role of roles) {
                if (GuildMember.hasRole(user, role, client, false)) {
                    await GuildMember.removeRole(user, role, reason)
                }
            }
            return false
        } else {
            for await (const role of roles) {
                if (!GuildMember.hasRole(user, role, client, false)) {
                    await GuildMember.addRole(user, role, reason)
                }
            }
            return true
        }
    }

    static async unmute(
        user: Discord.GuildMember,
        reason: string
    ): Promise<Discord.GuildMember> {
        await user.roles.remove(Guild.role(user.guild, Roles.MUTED), reason)
        return user
    }
}
