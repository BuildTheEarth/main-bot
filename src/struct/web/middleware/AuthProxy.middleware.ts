import { Injectable, NestMiddleware, Req, Res, Next } from "@nestjs/common"
import { FastifyReply, FastifyRequest } from "fastify"
import { ServerResponse } from "http"

@Injectable()
export default class AuthProxy implements NestMiddleware {
    use(
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply<ServerResponse>,
        @Next() next: () => unknown
    ): void {
        const ip =
            req.headers["x-forwarded-for"]?.toString() || req.raw.socket.remoteAddress
        if (
            req.headers.authorization === `Bearer ${globalThis.client.config.interKey}` &&
            globalThis.client.config.apiWhitelist.includes(ip)
        ) {
            globalThis.client.logger.info(
                `API ${req.raw.method} request to ${req.raw.url} from ${ip}`
            )
            next()
        } else {
            res.header("Content-Type", "application/json; charset=utf-8")
            res.status(401).send({ error: "NO_AUTH", message: "No authorization" })
            globalThis.client.logger.error(
                `API FAILED REQUEST ${req.raw.method} request to ${req.raw.url} from ${ip}`
            )
            return
        }
    }
}
