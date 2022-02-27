import express from "express"
import { Controller, Get, Post, Param, Req, Res, Body } from "@nestjs/common"
import GuildMember from "../../../discord/GuildMember"
import Roles from "../../../../util/roles.util"
import Discord from "discord.js"

@Controller("/api/v1/builder")
export default class BuilderController {
    @Get(":id")
    async builderGet(
        @Req() req: express.Request,
        @Res() res: express.Response,
        @Param("id") id: string
    ): Promise<unknown> {
        res.contentType("application/json")
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

        const userInfo = {
            id: user.id,
            hasBuilder: GuildMember.hasRole(user, Roles.BUILDER, globalThis.client, false)
        }

        res.send(userInfo)

        return
    }

    @Post(":id")
    async builderPost(
        @Req() req: express.Request,
        @Res() res: express.Response,
        @Param("id") id: string,
        @Body("add") add: boolean
    ): Promise<unknown> {
        res.contentType("application/json")

        if (!id) {
            return res
                .status(400)
                .send({ error: "MISSING_PARAMETER", message: "Missing parameter: id" })
        }

        if (add === null) {
            return res
                .status(400)
                .send({ error: "MISSING_PARAMETER", message: "Missing parameter: add" })
        }

        if (add !== true && add !== false) {
            return res
                .status(400)
                .send({ error: "INVALID_PARAMETER", message: "Invalid parameter: add" })
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

        try {
            if (add === true) {
                await GuildMember.addRole(
                    user,
                    Roles.BUILDER,
                    "API request from Build Team Bot"
                )
            }
            if (add === false) {
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
}
