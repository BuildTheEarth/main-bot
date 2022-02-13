import ApiPathHander from "../ApiPathHandler"
import express from "express"

export default new ApiPathHander({
    path: "/*",
    all: (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const ip = req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress
        if (
            req.headers.authorization === `Bearer ${globalThis.client.config.interKey}` &&
            globalThis.client.config.apiWhitelist.includes(ip)
        ) {
            globalThis.client.logger.info(
                `API ${req.method} request to ${req.url} from ${ip}`
            )
            next()
        } else {
            res.contentType("application/json")
            res.status(401).send({ error: "NO_AUTH", message: "No authorization" })
            globalThis.client.logger.error(
                `API FAILED REQUEST ${req.method} request to ${req.url} from ${ip}`
            )
            return
        }
    }
})
