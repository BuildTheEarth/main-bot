import { Controller, Get, Req, Res } from "@nestjs/common"
import { Response, Request } from "express"
import { ServerResponse } from "http"

@Controller("/api/v1/ping")
export default class PingController {
    @Get()
    ping(@Req() req: Request, @Res() res: Response): unknown {
        res.type("application/json")
        res.send({ content: "PONG" })
        return
    }
}
