import BotClient from "../struct/BotClient.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import CommandMessage from "../struct/CommandMessage.js"

import iso6391 from "../struct/client/iso6391.js"
import { formatTimestamp, hexToNum } from "@buildtheearth/bot-utils"
import OAuthToken from "../entities/OAuthToken.entity.js"
import { OAuth2API } from "@discordjs/core"
import { REST } from "discord.js"
import { discordEpoch } from "../util/discordEpoch.js"

export default new Command({
    name: "oauth",
    aliases: [],
    description: "Manage OAuth token.",
    permission: [
        globalThis.client.roles.BOT_DEVELOPER
    ],
    subcommands: [
        {
            name: "status",
            description: "Get oauth status"
        },
        {
            name: "link",
            description: "Get oauth link",
            args: [
                {
                    name: "redirect_url",
                    description: "Redirect URL to be used.",
                    required: true,
                    optionType: "STRING"
                },
            ]
        }
    ],
    async run(this: Command, client: BotClient, message: CommandMessage, args: Args) {
        const subcommand = args.consumeSubcommandIf([
            "status",
            "link",
        ])

        if (subcommand === "status" || !subcommand) {
            const token = await OAuthToken.getToken()
            if (!token) {
                return message.sendErrorMessageSeen("noOauthToken")
            }

            const oauth = new OAuth2API(new REST({ version: "10", authPrefix: 'Bearer'}).setToken(token))

            try {
                const currentAuth = await oauth.getCurrentAuthorizationInformation()

                const discordTimestamp = formatTimestamp(new Date(currentAuth.expires), "F")

                return message.sendSuccessMessage("oauthTokenInfo", discordTimestamp, currentAuth.scopes.join(", "))


            } catch {
                return message.sendErrorMessageSeen("noOauthToken")
            }
            

            
        } else if (subcommand === "link") {

            const redirectUri = args.consume("redirect_url")

            const oauthURL = await OAuthToken.generateOauthURL(client, redirectUri).catch(() => null)
            if (!oauthURL) {
                return message.sendErrorMessageSeen("howDidThisHappen")
            }
            
            return message.sendSuccess(oauthURL)
   
        }
    }
})
