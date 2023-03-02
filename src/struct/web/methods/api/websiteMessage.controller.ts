import { Controller, Get, Post, Param, Req, Res, Body } from "@nestjs/common"
import GuildMember from "../../../discord/GuildMember.js"
import Discord from "discord.js"
import { FastifyReply, FastifyRequest } from "fastify"
import { ServerResponse } from "http"
import _ from "lodash"
import { noop } from "@buildtheearth/bot-utils"

@Controller("/api/v1/website/message")
export default class WebsiteMessage {
    @Post(":message")
    async builderPost(
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply<ServerResponse>,
        @Param("message") message: string,
        @Body() body: Record<string, any>
    ): Promise<unknown> {
        res.type("application/json")

        if (!message) {
            return res
                .status(400)
                .send({ error: "MISSING_PARAMETER", message: "Missing parameter: message" })
        }

        if (body === null) {
            return res
                .status(400)
                .send({ error: "MISSING_PARAMETER", message: "Missing parameter: body" })
        }

        if (!body?.params) {
            return res
                .status(400)
                .send({ error: "MISSING_PARAMETER", message: "Missing parameter: body.params" })
        }

        if (!body?.ids) {
            return res
                .status(400)
                .send({ error: "MISSING_PARAMETER", message: "Missing parameter: body.ids" })
        }

        if (!_.isArrayLikeObject(body.ids)) {
            return res
                .status(400)
                .send({ error: "WRONG_DATATYPE", message: "Wrong datatype: body.ids must be an array" })
        }

        if (!client.webEvents.hasMessage(message)) return res.status(404).send({error: "NOT_FOUND", message: "Not found: requested message"})
        console.log(body.params)

        const finalMessage = client.webEvents.fill(message, body.params)
        const success = []
        const failure = []

        for (const id of body.ids) {
            if (typeof id === "string") {
                const user = await client.users.fetch(id).catch(noop)
                if (user) {
                    const res = await user.send(finalMessage).catch(noop)
                    if (!res) failure.push(id)
                    else success.push(id)
                }
                else failure.push(id)
            } else failure.push(id)
        }

        return res.status(200).send({success, failure, sentMessage: finalMessage})
    }
}
