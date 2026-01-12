import { OAuth2API } from "@discordjs/core"
import { Controller, Get, Param, Req, Res } from "@nestjs/common"
import { REST, Snowflake } from "discord.js"
import { Response, Request } from "express"
import OAuthToken from "../../../../entities/OAuthToken.entity.js"

@Controller("/oauth")
export default class OAuthController {
    @Get()
    async oauth(
        @Req() req: Request,
        @Res() res: Response,
        @Param("code") code: string
    ): Promise<void> {

        if (!globalThis.client.config.oauthEnabled) {
            res.status(503).send({
                message: "OAuth is currently disabled."
            })
            return
        }
        
        const oauth = new OAuth2API(new REST({ version: "10" }))
        const token = await oauth.tokenExchange({
            grant_type: "authorization_code",
            code: req.query.code as string,
            redirect_uri: `${globalThis.client.config.images.baseUrl}/oauth`,
            client_id: globalThis.client.user!.id as Snowflake,
            client_secret: globalThis.client.config.clientSecret
        })

        res.type("application/json")

        if (token.scope.includes("applications.commands.permissions.update")) {
            //store
            await OAuthToken.setToken(token.access_token, token.refresh_token)
            res.send({
                message: "Thank you for authorizing! Successfully authenticated."
            })
        } else {
            res.status(403).send({
                message: "You must have the required permissions to use this application."
            })
        }
    }
}
