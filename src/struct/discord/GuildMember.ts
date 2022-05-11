import Discord from "discord.js"
import Guild from "./Guild.js"

import Client from "../Client.js"

export default class GuildMember {
    static hasRole(
        user: Discord.GuildMember,
        roles: string[] | string[][],
        client: Client,
        botDevBypass = true
    ): boolean {
        let isStringArr = false
        roles.forEach(value => (isStringArr = typeof value != "object"))
        const isStringArrFunc = (roles: string[] | string[][]): roles is string[] =>
            isStringArr
        const isNotStringArrFunc = (roles: string[] | string[][]): roles is string[][] =>
            !isStringArr
        if (
            (isStringArrFunc(roles) && roles === globalThis.client.roles.ANY) ||
            (isNotStringArrFunc(roles) && roles.includes(globalThis.client.roles.ANY))
        )
            return true
        if (isStringArrFunc(roles)) roles = [roles]
        if (botDevBypass && client.config.developers.includes(user.id)) return true
        for (const role of roles) {
            if (user.roles.cache.find(r => role.includes(r.id))) return true
        }
        return false
    }

    static async mute(
        user: Discord.GuildMember,
        reason: string
    ): Promise<Discord.GuildMember> {
        await user.roles.add(
            Guild.role(user.guild, globalThis.client.roles.MUTED),
            reason
        )
        return user
    }

    static async addRole(
        user: Discord.GuildMember,
        roles: string[] | string[][],
        reason: string
    ): Promise<Discord.GuildMember> {
        let isStringArr = false
        roles.forEach(value => (isStringArr = typeof value != "object"))
        const isStringArrFunc = (roles: string[] | string[][]): roles is string[] =>
            isStringArr
        if (isStringArrFunc(roles)) roles = [roles]
        for (const role of roles) {
            await user.roles.add(Guild.role(user.guild, role), reason)
        }
        return user
    }

    static async removeRole(
        user: Discord.GuildMember,
        roles: string[] | string[][],
        reason: string
    ): Promise<Discord.GuildMember> {
        let isStringArr = false
        roles.forEach(value => (isStringArr = typeof value != "object"))
        const isStringArrFunc = (roles: string[] | string[][]): roles is string[] =>
            isStringArr
        if (isStringArrFunc(roles)) roles = [roles]
        for (const role of roles) {
            await user.roles.remove(Guild.role(user.guild, role), reason)
        }
        return user
    }

    static async toggleRole(
        user: Discord.GuildMember,
        roles: string[] | string[][],
        reason: string,
        client: Client
    ): Promise<boolean> {
        let isStringArr = false
        roles.forEach(value => (isStringArr = typeof value != "object"))
        const isStringArrFunc = (roles: string[] | string[][]): roles is string[] =>
            isStringArr
        if (isStringArrFunc(roles)) roles = [roles]
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
        await user.roles.remove(
            Guild.role(user.guild, globalThis.client.roles.MUTED),
            reason
        )
        return user
    }
}
