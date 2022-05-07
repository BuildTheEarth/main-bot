import { noop } from "@buildtheearth/bot-utils"
import Discord from "discord.js"
import typeorm from "typeorm"
import Client from "../struct/Client.js"
import SnowflakePrimaryColumn from "./decorators/SnowflakePrimaryColumn.decorator.js"

@typeorm.Entity({ name: "teampoint_permissions" })
export default class TeamPointPerms extends typeorm.BaseEntity {
    @SnowflakePrimaryColumn()
    roleId: string

    // -1 is unlimited
    @typeorm.Column({ type: "float", default: 0 })
    maxPoints: number

    // -1 is unlimited
    @typeorm.Column({ type: "float", default: 0 })
    minPoints: number

    // the -1 rule applies
    // Just gonna default at 10 for practical reasons
    @typeorm.Column({ type: "int", default: 10 })
    maxUsagesPerDay: number

    // Ngl copilot did like this whole file and it impresses me

    public static async getPerms(roleId: string): Promise<{
        maxPoints: number
        minPoints: number
        roleId: string
        maxUsagesPerDay: number
    }> {
        const perms = await TeamPointPerms.findOne({
            where: {
                roleId
            }
        })
        if (!perms) {
            return {
                maxPoints: 0,
                minPoints: 0,
                roleId,
                maxUsagesPerDay: 0
            }
        }
        return {
            maxPoints: perms.maxPoints,
            minPoints: perms.minPoints,
            roleId: perms.roleId,
            maxUsagesPerDay: perms.maxUsagesPerDay
        }
    }

    public static async setPerms(
        roleId: string,
        maxPoints: number,
        minPoints: number,
        maxUsagesPerDay: number
    ): Promise<void> {
        const perms = await TeamPointPerms.findOne({
            where: {
                roleId
            }
        })
        if (maxPoints === 0 && minPoints === 0 && maxUsagesPerDay === 0) {
            // Dont bother wasting an entry if its just 0, since thats the default
            if (perms) {
                await perms.remove()
            }
            return
        } else if (!perms) {
            await TeamPointPerms.create({
                maxPoints,
                minPoints,
                roleId,
                maxUsagesPerDay
            }).save()
        } else {
            perms.maxPoints = maxPoints
            perms.minPoints = minPoints
            perms.maxUsagesPerDay = maxUsagesPerDay
            await perms.save()
        }
    }

    public static async getAllPerms(): Promise<
        {
            roleId: string
            maxPoints: number
            minPoints: number
            maxUsagesPerDay: number
        }[]
    > {
        const perms = await TeamPointPerms.find()
        return perms.map(perm => ({
            roleId: perm.roleId,
            maxPoints: perm.maxPoints,
            minPoints: perm.minPoints,
            maxUsagesPerDay: perm.maxUsagesPerDay
        }))
    }

    public static async getPermsForMember(member: Discord.GuildMember): Promise<
        {
            roleId: string
            maxPoints: number
            minPoints: number
            maxUsagesPerDay: number
        }[]
    > {
        const userRoleIds = member.roles.cache.map(role => role.id)
        const perms = await TeamPointPerms.find({
            where: {
                roleId: typeorm.In(userRoleIds)
            }
        })
        return perms.map(perm => ({
            roleId: perm.roleId,
            maxPoints: perm.maxPoints,
            minPoints: perm.minPoints,
            maxUsagesPerDay: perm.maxUsagesPerDay
        }))
    }

    public static async getHighestPerms(member: Discord.GuildMember): Promise<{
        roleId: string
        maxPoints: number
        minPoints: number
        maxUsagesPerDay: number
    }> {
        const perms = await TeamPointPerms.getPermsForMember(member)
        if (perms.length === 0) {
            return {
                roleId: member.guild.id,
                maxPoints: 0,
                minPoints: 0,
                maxUsagesPerDay: 0
            }
        }
        return perms.reduce((acc, perm) => {
            if (perm.maxPoints > acc.maxPoints) {
                return perm
            }
            return acc
        })
    }

    public static async getHighestPermsId(
        client: Client,
        memberId: string
    ): Promise<{
        roleId: string
        maxPoints: number
        minPoints: number
        maxUsagesPerDay: number
    }> {
        const guildMember = await client.customGuilds
            .staff()
            .members.fetch(memberId)
            .catch(noop)
        if (!guildMember) {
            return {
                roleId: null,
                maxPoints: 0,
                minPoints: 0,
                maxUsagesPerDay: 0
            }
        }
        return await TeamPointPerms.getHighestPerms(guildMember)
    }
}
