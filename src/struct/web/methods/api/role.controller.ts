import { Controller, Get, Post, Param, Req, Res, Body } from "@nestjs/common"
import GuildMember from "../../../discord/GuildMember.js"
import Discord from "discord.js"
import { FastifyReply, FastifyRequest } from "fastify"
import { ServerResponse } from "http"

@Controller("/api/v1/role")
export default class RoleController {
    @Get(":id")
    async roleGet(
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply<ServerResponse>,
        @Param("id") id: string
    ): Promise<unknown> {
        res.type("application/json")
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

        await user.fetch()

        const userInfo = {
            id: user.id,
            roles: user.roles.cache.map(v => {
                return { name: v.name, id: v.id }
            })
        }

        res.send(userInfo)

        return
    }

    @Post(":id")
    async builderPost(
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply<ServerResponse>,
        @Param("id") id: string,
        @Body("add") add: boolean
    ): Promise<unknown> {
        res.type("application/json")
        return res.status(501).send({
            error: "NOT_IMPLEMENTED",
            message: "Function not implemented: Role Post"
        })
    }
}
