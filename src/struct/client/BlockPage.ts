import { hexToNum, hexToRGB } from "@buildtheearth/bot-utils"
import BotClient from "../BotClient.js"

import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders"
import { APIEmbed, ButtonStyle } from "discord.js"

type PendingBlockPageAction = "NEXT" | "PREVIOUS" | "STAY"

export default class BlockPage {
    client: BotClient
    rgbColor: [number, number, number]
    count: number
    version: string
    noText: boolean
    pendingAction: PendingBlockPageAction
    userID: string
    private page: number

    constructor(
        client: BotClient,
        rgbColor: [number, number, number],
        count: number,
        version: string,
        noText: boolean,
        userID: string,
        startPage?: number,
        pendingAction?: PendingBlockPageAction
    ) {
        this.client = client
        this.rgbColor = rgbColor
        this.count = count
        this.version = version
        this.noText = noText
        this.page = startPage ? startPage : 1
        this.pendingAction = pendingAction ? pendingAction : "STAY"
        this.userID = userID
    }

    //return true if the page was flipped, and false if value was too large or small
    nextPage(): boolean {
        if (this.page >= 99) return false
        this.page++
        return true
    }

    previousPage(): boolean {
        if (this.page <= 1) return false
        this.page--
        return true
    }

    getUrl() {
        return (
            `${this.client.config.images.apiUrl}?version=${
                this.version
            }&rgb=${this.rgbColor.join(",")}&count=${this.count}&height=512&page=${
                this.page
            }` + (this.noText ? "&noText=true" : "")
        )
    }

    nextCustomId() {
        return `blockPage|${this.rgbColor.join(",")}|${this.count}|${this.version}|${
            this.noText
        }|${this.page}|${this.userID}|NEXT`
    }

    previousCustomId() {
        return `blockPage|${this.rgbColor.join(",")}|${this.count}|${this.version}|${
            this.noText
        }|${this.page}|${this.userID}|PREVIOUS`
    }

    getEmbeds(authorName: string): APIEmbed[] {
        return [
            {
                title: `Blocks Closest Matching | ${this.version} | Page ${this.page}`,
                image: {
                    url: this.getUrl()
                },
                color: hexToNum(client.config.colors.info),
                footer: {
                    text: `Summoned by ${authorName}`
                }
            }
        ]
    }

    getButtons() {
        const nextButton = new ButtonBuilder()
        nextButton.setCustomId(this.nextCustomId())
        nextButton.setStyle(ButtonStyle.Primary)
        nextButton.setLabel(client.config.emojis.right as string)

        const previousButton = new ButtonBuilder()
        previousButton.setCustomId(this.previousCustomId())
        previousButton.setStyle(ButtonStyle.Primary)
        previousButton.setLabel(client.config.emojis.left as string)

        const interactionRow = new ActionRowBuilder<ButtonBuilder>()
        interactionRow.addComponents(previousButton, nextButton)

        return [interactionRow]
    }

    getEmbedWithButtons(authorName: string) {
        return {
            embeds: this.getEmbeds(authorName),
            components: this.getButtons()
        }
    }

    public static fromCustomId(client: BotClient, customID: string): BlockPage {
        const arr = customID.split("|")

        const pendingAction = arr[7] as PendingBlockPageAction

        return new BlockPage(
            client,
            arr[1].split(",").map(val => Number.parseInt(val)) as [
                number,
                number,
                number
            ],
            Number.parseInt(arr[2]),
            arr[3],
            arr[4].toLowerCase() == "true",
            arr[6],
            Number.parseInt(arr[5]),
            pendingAction
        )
    }
}
