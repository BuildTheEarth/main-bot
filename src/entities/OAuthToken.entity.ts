import { OAuth2API } from "@discordjs/core"
import { REST, Snowflake } from "discord.js"
import * as typeorm from "typeorm"
import BotClient from "../struct/BotClient.js"
import Cron from "croner"

@typeorm.Entity({ name: "oauth_tokens" })
export default class OAuthToken extends typeorm.BaseEntity {
    @typeorm.PrimaryGeneratedColumn()
    id!: number
    
    @typeorm.Column({ length: 255 })
    bearerToken!: string
    
    @typeorm.Column({ length: 255 })
    refreshToken!: string

    refreshCron: Cron | null = null

    public static async setToken(bearerToken: string, refreshToken: string) {
        const existing = await OAuthToken.findOne()
        if (existing) {
            existing.bearerToken = bearerToken
            existing.refreshToken = refreshToken
            await existing.save()
        } else {
            const token = new OAuthToken()
            token.bearerToken = bearerToken
            token.refreshToken = refreshToken
            await token.save()
        }
    }

    public static async initToken(client: BotClient): Promise<void> {
        const existing = await OAuthToken.findOne()
        
        if (existing) {
            const token = await this.refreshToken(client)

            if (!token) return
            token.refreshCron = new Cron("0 0 */3 * *", () => {
                this.refreshToken(client)
            })
        }
    }

    public static async refreshToken(client: BotClient): Promise<OAuthToken | null> {
        const existing = await OAuthToken.findOne()

        if (existing) {
            const oauth = new OAuth2API(new REST({ version: "10" }))
            try {
            const result = await oauth.refreshToken({
                grant_type: "refresh_token",
                refresh_token: existing.refreshToken,
                client_id: client.user!.id as Snowflake,
                client_secret: client.config.clientSecret
                })

                await OAuthToken.setToken(result.access_token, result.refresh_token)
            } catch (error) {
                client.logger.error("Failed to refresh OAuth token:", error)
                //delete token
                await existing.remove()
                return null
            }
        }

        return existing || null
    }

    public static async getToken(): Promise<string | null> {
        const existing = await OAuthToken.findOne()
        
        if (existing) {
            return existing.bearerToken
        }   
        return null
    }

    public static async generateOauthURL(client: BotClient, redirectUri: string): Promise<string> {
        const oauth = new OAuth2API(new REST({ version: "10" }))
        const url = oauth.generateAuthorizationURL({
            client_id: client.user!.id as Snowflake,
            redirect_uri: redirectUri,
            scope: "identify applications.commands.permissions.update",
            response_type: "code",
            //@ts-ignore
            integration_type: 1,
            prompt: "consent"
        })
        return url
    }
}