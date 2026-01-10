import { Controller, Get, Param, Req, Res } from "@nestjs/common"
import { Response, Request } from "express"

@Controller("/api/v1/bannedwords")
export default class BannedWordsController {
    @Get()
    async getBannedWords(@Req() req: Request, @Res() res: Response): Promise<unknown> {
        res.type("application/json")

        const bannedWords = globalThis.client.filterWordsCached.banned
        const exceptions = globalThis.client.filterWordsCached.except

        const formattedReturns = {
            banned: bannedWords,
            exceptions: exceptions
        }

        res.send(formattedReturns)

        return
    }
}
