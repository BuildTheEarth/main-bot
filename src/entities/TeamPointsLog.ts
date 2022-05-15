import { hexToRGB, noop } from "@buildtheearth/bot-utils"
import Discord from "discord.js"
import typeorm, { FindManyOptions } from "typeorm"
import SnowflakeColumn from "./decorators/SnowflakeColumn.decorator.js"
import TeamPointsUser from "./TeamPointsUser.entity.js"
import Sentiment = require("sentiment")

@typeorm.Entity({ name: "teampoints_log" })
export default class TeamPointsLog extends typeorm.BaseEntity {
    @typeorm.PrimaryGeneratedColumn()
    id: number

    @typeorm.CreateDateColumn()
    createdAt: Date

    @SnowflakeColumn()
    roleId: string

    @SnowflakeColumn()
    actorId: string

    @typeorm.Column({ type: "float" })
    pointChange: number

    @typeorm.Column({ type: "text" })
    reason: string

    //TODO: more data proccessing functions

    public static async getLogs(options: {
        roleId?: string,
        actorId?: string, 
        order: "ASC" | "DESC", 
        maxDate?: Date,
        minDate?: Date, 
        exactDate?: Date,
        count?: number,
    }): Promise<TeamPointsLog[]> {
        const opts: typeorm.FindConditions<TeamPointsLog> = {}
        if (options.roleId) {
            opts.roleId = options.roleId
        }
        if (options.actorId) {
            opts.actorId = options.actorId
        }
        if (options.maxDate && options.minDate) {
            opts.createdAt = typeorm.Between(options.minDate, options.maxDate)
        } else if (options.maxDate) {
            opts.createdAt = typeorm.LessThan(options.maxDate)
        } else if (options.minDate) {
            opts.createdAt = typeorm.MoreThan(options.minDate)
        } else if (options.exactDate) {
            opts.createdAt = typeorm.Equal(options.exactDate)
        }

        const finalOpts: FindManyOptions<TeamPointsLog> = {
            where: opts,
            order: {
                createdAt: options.order? options.order : "DESC"
            }
        }
        if (options.count) {
            finalOpts.take = options.count
        }

        return TeamPointsLog.find(finalOpts)
    }

    public static async canDoAction(roleId: string, actorId: string, pointChange: number, reason: string): Promise<{ canDo: boolean; error?: string }> {
        const sentiment = new Sentiment()
        if (!(await TeamPointsUser.shouldCommandPass(actorId, pointChange))) {
            return { canDo: false, error: "DAILY_LIMIT_OR_MAX" }
        }
        if (sentiment.analyze(reason).score < -2) {
            return { canDo: false, error: "REASON_BAD" }
        }
        return { canDo: true }
    }

    public static async addLog (roleId: string, actorId: string, pointChange: number, reason: string): Promise<TeamPointsLog> {
        const log = new TeamPointsLog()
        log.roleId = roleId
        log.actorId = actorId
        log.pointChange = pointChange
        log.reason = reason
        await log.save()
        await log.logAction()
        await TeamPointsUser.addCommandUsage(actorId)
        return log
    }

    public static async getLogChannel(): Promise<Discord.TextBasedChannel> {
        const returnChannel = await client.channels.fetch(client.config.logging.pointLog).catch(noop)
        if (!returnChannel) {
            return null
        }
        if (returnChannel.isText()) return returnChannel
        return null
    }

    async logAction(): Promise<void> {
        const channel = await TeamPointsLog.getLogChannel()
        if (!channel) {
            return
        }
        const embed = new Discord.MessageEmbed()
        embed.setTitle(`<@${this.actorId}> ${this.pointChange > 0 ? "gave" : "took"} ${this.pointChange} points to <@&${this.roleId}>`)
        embed.setDescription(this.reason)
        embed.setTimestamp(this.createdAt)
        embed.setColor(this.pointChange > 0 ? hexToRGB(client.config.colors.success) : hexToRGB(client.config.colors.error))

        await channel.send({embeds: [embed]})

    }


}
