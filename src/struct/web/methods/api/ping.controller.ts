import { Controller, Get, Req, Res } from "@nestjs/common"
import { FastifyReply, FastifyRequest } from "fastify"
import { ServerResponse } from "http"

@Controller("/api/v1/ping")
export default class PingController {
    @Get()
    ping(@Req() req: FastifyRequest, @Res() res: FastifyReply<ServerResponse>): unknown {
        res.type("application/json")
        res.send({ content: "PONG" })
        return
    }
}
