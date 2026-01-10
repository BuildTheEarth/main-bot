import BotClient from "../struct/BotClient.js"
import { makeURLSearchParams, REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v10"
import {RESTPostOAuth2ClientCredentialsResult} from "@discordjs/core"

export default async function getBearerToken(client: BotClient): Promise<string | null> {
    const rest = new REST({ version: "10" })

    try {
        const result = (await rest.post(Routes.oauth2TokenExchange(), {
            body: makeURLSearchParams({
                grant_type: "client_credentials",
                scope: "identify applications.commands.update"
            }),
            passThroughBody: true,
            headers: {
                Authorization: `Basic ${btoa(`${client.user!.id}:${client.config.clientSecret}`)}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            auth: false
        })) as RESTPostOAuth2ClientCredentialsResult

        console.log (result)

        return result.access_token
    }

    catch (error) {
        client.logger.error("Failed to get bearer token:", error)
        return null
    }
}
