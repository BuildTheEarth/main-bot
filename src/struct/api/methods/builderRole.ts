import ApiPathHander from "../ApiPathHandler"
import express from "express"
import GuildMember from "../../discord/GuildMember"
import Roles from "../../../util/roles"
import Discord from "discord.js"

export default new ApiPathHander({
    path: "/builder",
    get: async (req: express.Request, res: express.Response) => {
        res.contentType("application/json")
        const params = req.query
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

        const userInfo = {
            id: user.id,
            hasBuilder: GuildMember.hasRole(user, Roles.BUILDER, globalThis.client, false)
        }

        res.send(userInfo)

        return
    },

    post: async (req: express.Request, res: express.Response) => {
        res.contentType("application/json")
        const params = req.body

        if (!params) {
            return res
                .status(400)
                .send({ error: "NO_BODY", message: "Missing POST body" })
        }

        if (!params.id) {
            return res
                .status(400)
                .send({ error: "MISSING_PARAMETER", message: "Missing parameter: id" })
        }

        if (params.add === null) {
            return res
                .status(400)
                .send({ error: "MISSING_PARAMETER", message: "Missing parameter: add" })
        }

        if (params.add !== true && params.add !== false) {
            return res
                .status(400)
                .send({ error: "INVALID_PARAMETER", message: "Invalid parameter: add" })
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

        try {
            if (params.add === true) {
                await GuildMember.addRole(
                    user,
                    Roles.BUILDER,
                    "API request from Build Team Bot"
                )
            }
            if (params.add === false) {
                await GuildMember.removeRole(
                    user,
                    Roles.BUILDER,
                    "API request from Build Team Bot"
                )
            }
        } catch {
            return res.status(500).send({
                error: "SERVER_ERROR",
                message: "An issue has occured assigning: role"
            })
        }

        const userInfo = {
            id: user.id,
            hasBuilder: GuildMember.hasRole(user, Roles.BUILDER, globalThis.client, false)
        }

        res.send(userInfo)

        return
    }
})
