import { noop } from "@buildtheearth/bot-utils"
import Cron from "croner"
import typeorm from "typeorm"
import SnowflakePrimaryColumn from "./decorators/SnowflakePrimaryColumn.decorator.js"
import TeamPointPerms from "./TeamPointPerms.entity.js"

@typeorm.Entity({ name: "teampoint_users" })
export default class TeamPointsUser extends typeorm.BaseEntity {
    @SnowflakePrimaryColumn()
    userId!: string

    @typeorm.Column({ type: "integer", default: 0 })
    commandUsagesToday!: number

    private async getMaxUsages(): Promise<{
        roleId: string | null
        maxPoints: number
        minPoints: number
        maxUsagesPerDay: number
    } | null> {
        return await TeamPointPerms.getHighestPermsId(client, this.userId).catch(noop)
    }

    public static registerDailyReset(): void {
        Cron("0 0 * * *", async () => {
            const users = await TeamPointsUser.find()
            for (const user of users) {
                user.commandUsagesToday = 0
                await user.save()
            }
        })
    }

    public static async getUser(userId: string): Promise<{
        userId: string
        commandUsages: number
        commandUsagesLeft: number
    }> {
        const user = await TeamPointsUser.findOne({
            where: {
                userId
            }
        })
        if (!user) {
            return {
                userId,
                commandUsages: 0,
                commandUsagesLeft: 0
            }
        }

        const role = await user.getMaxUsages()

        if (!role) {
            return {
                userId,
                commandUsages: 0,
                commandUsagesLeft: 0
            }
        }

        const usagesLeft = role.maxUsagesPerDay - user.commandUsagesToday

        return {
            userId: userId,
            commandUsages: user.commandUsagesToday,
            commandUsagesLeft: usagesLeft
        }
    }

    public static async addCommandUsage(userId: string): Promise<void> {
        const user = await TeamPointsUser.findOne({
            where: {
                userId
            }
        })
        if (!user) {
            await TeamPointsUser.create({
                userId,
                commandUsagesToday: 1
            }).save()
        } else {
            user.commandUsagesToday++
            await user.save()
        }
    }

    public static async shouldCommandPass(
        userId: string,
        pointsGiven: number
    ): Promise<boolean> {
        const user = await TeamPointsUser.findOne({
            where: {
                userId
            }
        })
        if (!user) {
            const limit = await TeamPointPerms.getHighestPermsId(client, userId).catch(
                noop
            )
            if (!limit) {
                return false
            } else {
                if (limit.minPoints === -1 && limit.maxPoints === -1) {
                    return true
                } else if (limit.minPoints === -1) {
                    return pointsGiven <= limit.maxPoints
                } else if (limit.maxPoints === -1) {
                    return pointsGiven >= limit.minPoints
                } else if (
                    pointsGiven < limit.minPoints ||
                    pointsGiven > limit.maxPoints
                ) {
                    return false
                }
                return true
            }
        }
        const role = await user.getMaxUsages()
        if (!role) {
            return false
        }
        if (role.minPoints === -1 && role.maxPoints === -1) {
            return true
        } else if (role.minPoints === -1) {
            return pointsGiven <= role.maxPoints
        } else if (role.maxPoints === -1) {
            return pointsGiven >= role.minPoints
        } else if (pointsGiven < role.minPoints || pointsGiven > role.maxPoints) {
            return false
        }
        if (user.commandUsagesToday >= role.maxUsagesPerDay) {
            return false
        }
        return true
    }
}
