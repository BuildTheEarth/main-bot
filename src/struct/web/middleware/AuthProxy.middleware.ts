import { Injectable, NestMiddleware, Req, Res, Next } from "@nestjs/common"
import { Response, Request } from "express"
import { ServerResponse } from "http"

@Injectable()
export default class AuthProxy implements NestMiddleware {
    use(
        @Req() req: Request,
        @Res() res: Response,
        @Next() next: () => unknown
    ): void {
        const ip =
            req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress
        if (
            req.headers.authorization == `Bearer ${globalThis.client.config.interKey}`
        ) {
            globalThis.client.logger.info(
                `API ${req.method} request to ${req.url} from ${ip}`
            )
            next()
        } else {
            res.header("Content-Type", "application/json; charset=utf-8")
            res.status(401).send({ error: "NO_AUTH", message: "No authorization" })
            globalThis.client.logger.error(
                `API FAILED REQUEST ${req.method} request to ${req.url} from ${ip}`
            )
            return
        }
    }
}
