import { Controller, Get, Param, Req, Res } from "@nestjs/common"
import { Response, Request } from "express"
import Placeholder from "../../../../entities/Placeholder.entity.js"

@Controller("/api/v1/placeholders")
export default class PlaceholderController {
    @Get()
    async getPlaceholders(
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<unknown> {
        res.type("application/json")

        const retMap = new Map<string, Placeholder[]>

        for (const placeholder of client.placeholder.cache) {
            if (retMap.has(placeholder[1].name)) {
                const currValues = retMap.get(placeholder[1].name)
                currValues?.push(placeholder[1])
            } else {
                retMap.set(placeholder[1].name, [placeholder[1]])
            }
        }
        
        res.send(Object.fromEntries(retMap))

        return
    }
}
