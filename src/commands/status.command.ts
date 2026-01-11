import BotClient from "../struct/BotClient.js"
import Command from "../struct/Command.js"
import { hexToNum } from "@buildtheearth/bot-utils"
import CommandMessage from "../struct/CommandMessage.js"
import WebSocket from "ws"
import _ from "lodash"
import { APIEmbed, escapeMarkdown } from "discord.js"

export default new Command({
    name: "status",
    aliases: ["online", "network"],
    description: "Check the status of the Minecraft network.",
    permission: globalThis.client.roles.ANY,
    globalRegister: true,
    userInstallContext: true,
    async run(this: Command, client: BotClient, message: CommandMessage) {
        await message.continue()

        const ws = new WebSocket(client.config.wmSocket)

        ws.on("error", async () => {
            return await message.sendErrorMessageSeen("networkOffline")
        })

        ws.on("open", function open() {
            const request = {
                salt: "ABCDE",
                id: "BOT",
                type: "all_players",
                data: {}
            }

            ws.send(JSON.stringify(request))
        })

        ws.on("message", async (data: string) => {
            const jsonParsed = JSON.parse(data)

            const trueData: any[] = jsonParsed["data"]["response_data"]

            if (!trueData) return await message.sendErrorMessageSeen("networkOffline")

            if (trueData.length == 0) {
                const embed = <APIEmbed>{
                    title: "No players are online",
                    description: message.getMessage("networkOnline"),
                    footer: { text: "IP: BuildTheEarth.net, bedrock.BuildTheEarth.net" },
                    color: hexToNum(client.config.colors.success)
                }

                return await message.send({ embeds: [embed] })
            }

            const playersPerServer = new Map<string, string[]>()

            trueData.forEach(
                (player: {
                    Attributes: { LAST_SERVER: string }
                    Name: string
                    DiscordID?: string
                }) => {
                    if (playersPerServer.has(player.Attributes.LAST_SERVER)) {
                        playersPerServer
                            .get(player.Attributes.LAST_SERVER)
                            ?.push(
                                player.Name +
                                    (player["DiscordID"]
                                        ? ` (<@${player.DiscordID}>)`
                                        : "")
                            )
                    } else {
                        playersPerServer.set(player.Attributes.LAST_SERVER, [
                            player.Name +
                                (player["DiscordID"] ? ` (<@${player.DiscordID}>)` : "")
                        ])
                    }
                }
            )

            let charCount = 0

            let numbersOnly = false

            let embedFields: { name: string; value: string }[] = Array.from(
                playersPerServer.entries()
            ).map((entry: [string, string[]]) => {
                if (!entry || !entry[1] || !entry[0]) {
                    return { name: entry[0] || "No Server", value: "**Nobody online**" }
                }

                const localCharCount = _.sum(
                    entry[1].map(e => " - " + escapeMarkdown(e).length + "\n")
                )
                charCount += entry[0].length + 3 + localCharCount
                if (localCharCount > 1024) numbersOnly = true

                return {
                    name: entry[0],
                    value: entry[1].map(e => "- " + escapeMarkdown(e)).join("\n")
                }
            })

            if (charCount > 5800 || numbersOnly) {
                embedFields = Array.from(playersPerServer.entries()).map(
                    (entry: [string, string[]]) => {
                        if (!entry || !entry[1] || !entry[0]) {
                            return {
                                name: entry[0] || "No Server",
                                value: "**Nobody online**"
                            }
                        }

                        return { name: entry[0], value: entry[1].length + " members" }
                    }
                )
            }

            const embed = <APIEmbed>{
                description: message.getMessage("networkOnline"),
                fields: embedFields,
                footer: { text: `BuildTheEarth.net Total Players: ${trueData.length}` },
                color: hexToNum(client.config.colors.success)
            }

            return await message.send({ embeds: [embed] })
        })
    }
})
