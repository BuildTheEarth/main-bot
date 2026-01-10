import { GuildMember } from "discord.js"
import BotGuild from "./BotGuild.js"

import BotClient from "../BotClient.js"

export default class BotGuildMember {
    static hasRole(
        user: GuildMember,
        roles: string[] | string[][],
        client: BotClient,
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
        user: GuildMember,
        reason: string
    ): Promise<GuildMember> {
        await user.roles
            .add(BotGuild.role(user.guild, globalThis.client.roles.MUTED), reason)
            .catch(error => console.log(error))
        return user
    }

    static async addRole(
        user: GuildMember,
        roles: string[] | string[][],
        reason: string
    ): Promise<GuildMember> {
        let isStringArr = false
        roles.forEach(value => (isStringArr = typeof value != "object"))
        const isStringArrFunc = (roles: string[] | string[][]): roles is string[] =>
            isStringArr
        if (isStringArrFunc(roles)) roles = [roles]
        for (const role of roles) {
            await user.roles.add(BotGuild.role(user.guild, role), reason)
        }
        return user
    }

    static async removeRole(
        user: GuildMember,
        roles: string[] | string[][],
        reason: string
    ): Promise<GuildMember> {
        let isStringArr = false
        roles.forEach(value => (isStringArr = typeof value != "object"))
        const isStringArrFunc = (roles: string[] | string[][]): roles is string[] =>
            isStringArr
        if (isStringArrFunc(roles)) roles = [roles]
        for (const role of roles) {
            await user.roles.remove(BotGuild.role(user.guild, role), reason)
        }
        return user
    }

    static async toggleRole(
        user: GuildMember,
        roles: string[] | string[][],
        reason: string,
        client: BotClient
    ): Promise<boolean> {
        let isStringArr = false
        roles.forEach(value => (isStringArr = typeof value != "object"))
        const isStringArrFunc = (roles: string[] | string[][]): roles is string[] =>
            isStringArr
        if (isStringArrFunc(roles)) roles = [roles]
        const shouldAdd: boolean[] = []
        for (const role of roles) {
            shouldAdd.push(!BotGuildMember.hasRole(user, role, client, false))
        }
        if (shouldAdd.includes(false)) {
            for await (const role of roles) {
                if (BotGuildMember.hasRole(user, role, client, false)) {
                    await BotGuildMember.removeRole(user, role, reason)
                }
            }
            return false
        } else {
            for await (const role of roles) {
                if (!BotGuildMember.hasRole(user, role, client, false)) {
                    await BotGuildMember.addRole(user, role, reason)
                }
            }
            return true
        }
    }

    static async unmute(
        user: GuildMember,
        reason: string
    ): Promise<GuildMember> {
        await user.roles.remove(
            BotGuild.role(user.guild, globalThis.client.roles.MUTED),
            reason
        )
        return user
    }
}
