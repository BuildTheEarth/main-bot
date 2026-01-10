import { Collection, GuildMember } from "discord.js"
import typeorm, { FindManyOptions } from "typeorm"
import { Controller, Get, Param, Req, Res } from "@nestjs/common"
import ActionLog, { Action } from "../../../../entities/ActionLog.entity.js"
import { Response, Request } from "express"
import { ms } from "@buildtheearth/bot-utils"
import TimedPunishment from "../../../../entities/TimedPunishment.entity.js"

function getType(entity: ActionLog | TimedPunishment): Action {
    if (entity instanceof ActionLog) {
        return entity.action
    } else {
        return entity.type
    }
}
@Controller("/api/v1/punish")
export default class PunishController {
    @Get(":id?")
    async getPunishment(
        @Req() req: Request,
        @Res() res: Response,
        @Param("id") id: string
    ): Promise<unknown> {
        res.type("application/json")
        const params = req.query
        const showDeleted = params["showDeleted"] ? true : false
        const count = params["count"] ? true : false
        const group = params["noGroup"] ? false : true
        const timed = params["timedPunishment"] ? true : false
        const noZero = (params["noZero"] ? true : false) && timed

        let since = 0

        if (typeof params["since"] == "string") {
            since = ms(params["since"])
        }

        let order = true

        if (params["order"] == "ASC") order = false

        let criteria:
            | typeorm.FindManyOptions<ActionLog>
            | typeorm.FindManyOptions<TimedPunishment> = {}

        if (id) {
            const userList = typeof id === "string" ? id : null // we need to add proper multi-user support later

            if (!userList) {
                return res
                    .status(404)
                    .send({ error: "NOT_FOUND", message: "Not found: user" })
            }

            let user: GuildMember

            try {
                user = await globalThis.client.customGuilds
                    .main()
                    .members.fetch({ user: userList })
            } catch {
                return res
                    .status(404)
                    .send({ error: "NOT_FOUND", message: "Not found: user" })
            }

            if (!user) {
                return res
                    .status(404)
                    .send({ error: "NOT_FOUND", message: "Not found: user" })
            }

            criteria = { where: { member: user.id } }

            if (showDeleted) {
                criteria = {
                    where: {
                        member: user.id,
                        deletedAt: timed
                            ? typeorm.Not<TimedPunishment>(typeorm.IsNull())
                            : typeorm.Not<ActionLog>(typeorm.IsNull())
                    }
                }

                criteria.withDeleted = true
            }
        } else {
            if (showDeleted) {
                criteria = {
                    where: {
                        deletedAt: timed
                            ? typeorm.Not<TimedPunishment>(typeorm.IsNull())
                            : typeorm.Not<ActionLog>(typeorm.IsNull())
                    }
                }

                criteria.withDeleted = true
            }
        }

        let actionLogs: (ActionLog | TimedPunishment)[] | null = null

        if (timed)
            actionLogs = await TimedPunishment.find(
                criteria as FindManyOptions<TimedPunishment>
            )
        else actionLogs = await ActionLog.find(criteria as FindManyOptions<ActionLog>)

        if (!actionLogs) return

        actionLogs = actionLogs
            .filter(value => {
                if (since <= value.createdAt.getTime()) {
                    if (noZero) return (value as TimedPunishment).length > 0
                    else return true
                } else return false
            })
            .sort((a, b) => {
                if (a.createdAt == b.createdAt) return 0
                if (a.createdAt > b.createdAt) return order ? -1 : 1
                else return order ? 1 : -1
            })

        if (!group) {
            res.send(actionLogs)
            return
        }

        let categorizedLogs: Collection<
            Action,
            (ActionLog | TimedPunishment)[] | number
        > = new Collection([
            ["warn", []],
            ["mute", []],
            ["kick", []],
            ["ban", []],
            ["unmute", []],
            ["unban", []]
        ])

        if (count) {
            categorizedLogs = new Collection([
                ["warn", 0],
                ["mute", 0],
                ["kick", 0],
                ["ban", 0],
                ["unmute", 0],
                ["unban", 0]
            ])

            for (const log of actionLogs) {
                categorizedLogs.set(
                    getType(log),
                    (categorizedLogs.get(getType(log)) as number) + 1
                )
            }
        } else
            for (const log of actionLogs) {
                const pushArr = categorizedLogs.get(getType(log))
                if (!pushArr) continue
                if (typeof pushArr != "number") pushArr.push(log)
            }

        res.send(Object.fromEntries(categorizedLogs))

        return
    }
}
