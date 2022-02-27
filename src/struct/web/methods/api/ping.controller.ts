import express from "express"
import { Controller, Get, Req, Res } from "@nestjs/common"

@Controller("/api/v1/ping")
export default class PingController {
    @Get()
    ping(@Req() req: express.Request, @Res() res: express.Response): unknown {
        res.contentType("application/json")
        res.send({ content: "PONG" })
        return
    }
}
