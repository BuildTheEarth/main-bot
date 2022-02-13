import ApiPathHander from "../ApiPathHandler"
import express from "express"

export default new ApiPathHander({
    path: "/ping",
    get: (req: express.Request, res: express.Response) => {
        res.contentType("application/json")
        res.send({ content: "PONG" })
        return
    }
})
