import ApiPathHander from "../ApiPathHandler"
import express from "express"
import Discord from "discord.js"
import { FindManyOptions, IsNull, Not } from "typeorm"
import ActionLog, { Action } from "../../../entities/ActionLog"

export default new ApiPathHander({
    path: "/punish",
    get: async (req: express.Request, res: express.Response) => {
        res.contentType("application/json")
        const params = req.query
        const showDeleted = params["showDeleted"]? true : false

        if (!params["id"]) {
            return res.send({
                error: "MISSING_PARAMETER",
                message: "Missing parameter: id"
            })
        }

        const userList = typeof params["id"] === "string" ? params["id"] : null // we need to add proper multi-user support later

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
})