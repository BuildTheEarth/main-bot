import express from "express"
import Discord from "discord.js"
import { FindManyOptions, IsNull, Not } from "typeorm"
import { Controller, Get, Param, Req, Res } from "@nestjs/common"
import ActionLog, { Action } from "../../../../entities/ActionLog.entity"

@Controller('/api/v1/punish')
export default class PunishController {
    @Get(':id')
    async getPunishment (@Req() req: express.Request, @Res() res: express.Response, @Param('id') id: string): Promise<unknown> {
        res.contentType("application/json")
        const params = req.query
        const showDeleted = params["showDeleted"]? true : false

        if (!id) {
            return res.send({
                error: "MISSING_PARAMETER",
                message: "Missing parameter: id"
            })
        }

        const userList = typeof id === "string" ? id : null // we need to add proper multi-user support later

        if (!userList) {
            return res.send({
                error: "INVALID_PARAMETER",
                message: "Invalid parameter: id"
            })
        }

        let user: Discord.GuildMember

        try {
            user = await globalThis.client.customGuilds
                .main()
                .members.fetch({ user: userList })
        } catch {
            return res.send({ error: "NOT_FOUND", message: "Not found: user" })
        }

        if (!user) {
            return res.send({ error: "NOT_FOUND", message: "Not found: user" })
        }

        let criteria: FindManyOptions<ActionLog> = { where: { member: user.id } }
        if (showDeleted) {
            criteria = { where: { member: user.id, deletedAt: Not<ActionLog>(IsNull()) } }

            criteria.withDeleted = true
        }

        const actionLogs = await ActionLog.find(criteria)
        const categorizedLogs: Record<Action, ActionLog[]> = {
            warn: [],
            mute: [],
            kick: [],
            ban: [],
            unmute: [],
            unban: []
        }

        const clean = !actionLogs.length
        for (const log of actionLogs) categorizedLogs[log.action].push(log)

        if (clean) res.send(categorizedLogs)
        else res.send(categorizedLogs)

        
        return
    }
}