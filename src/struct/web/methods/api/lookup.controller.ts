import {
    Controller,
    Get,
    Post,
    Param,
    Req,
    Res,
    Body,
    Query,
    ParseArrayPipe,
    ParseBoolPipe
} from "@nestjs/common"
import GuildMember from "../../../discord/GuildMember.js"
import Discord from "discord.js"
import { Response, Request } from "express"
import { fetchPeopleByRoles } from "../../../../util/roles.util.js"
import { noop } from "@buildtheearth/bot-utils"

@Controller("/api/v1/lookup/roles")
export default class LookupController {
    @Get("/id")
    async builderGet(
        @Req() req: Request,
        @Res() res: Response,
        @Query("roles", new ParseArrayPipe({ items: String, separator: "," }))
        roles: string[],
        @Query("extended", new ParseBoolPipe({ optional: true })) extended: boolean
    ): Promise<unknown> {
        if (!roles || roles.length == 0) {
            return res
                .status(400)
                .send({ error: "MISSING_PARAMETER", message: "Missing parameter: roles" })
        }

        const roleData = await fetchPeopleByRoles(
            globalThis.client,
            roles,
            extended
        ).catch(noop)

        if (!roleData)
            return res.status(500).send({
                error: "SERVER_ERROR",
                message: "An issue has occured assigning: role"
            })

        res.send(Object.fromEntries(roleData))
    }
}
