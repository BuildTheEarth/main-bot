import Client from "../struct/Client.js"
import Command from "../struct/Command.js"

import Discord, { EmbedData } from "discord.js"
import Args from "../struct/Args.js"
import CommandMessage from "../struct/CommandMessage.js"
import { hexToNum, hexToRGB } from "@buildtheearth/bot-utils"
import { createCommonJS } from 'mlly'
const { __dirname, __filename, require } = createCommonJS(import.meta.url)
//@ts-ignore I'm sorry but sharp imports are just broken for typings :sob:
import sharp from 'sharp'
import fetch from "node-fetch";
import BlockPage from "../struct/client/BlockPage.js"

export default new Command({
    name: "block",
    aliases: [],
    description: "Find a minecraft block closest to a given color!",
    permission: globalThis.client.roles.ANY,
    inheritGlobalArgs: true,
    args: [
        {
            name: "version",
            description: "Minecraft version to search blocks for",
            required: false,
            optionType: "STRING",
            choices: ["1.12", "1.20"]
        },
        {
            name: "count",
            description: "Number of blocks to show per page",
            required: false,
            optionType: "INTEGER",
            maxLenOrValue: 9,
            minLenOrValue: 1
        },
        {
            name: "notext",
            description: "Select this option if you want no text on your image",
            required: false,
            optionType: "BOOLEAN"
        }
    ],
    subcommands: [
        {
            name: "image",
            description: "Search for blocks based on an image",
            args: [
                {
                    name: "image",
                    description: "The image to match blocks to",
                    required: true,
                    optionType: "ATTACHMENT"
                }
            ]
        },
        {
            name: "color",
            description: "Search for blocks based on a color",
            args: [
                {
                    name: "hexcode",
                    description: "The hex code of the color you want to input",
                    required: true,
                    optionType: "STRING",
                    maxLenOrValue: 7,
                    minLenOrValue: 6
                }
            ]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const subcommand = args.consumeSubcommandIf(["image", "color"])

        if (!subcommand) return message.sendErrorMessage("howDidThisHappen")

        let version = args.consume("version")

        if (!version) {
            version = "1.20"
        }

        let count = args.consumeInteger("count")

        if (!count) count = 3

        count = Math.round(count)

        if (count < 1 || count > 9) {
            return message.sendErrorMessage("howDidThisHappen")
        }

        const noText = args.consumeBoolean("notext")


        let color: [number, number, number] | null = null

        if (subcommand == "color") {
            let hexCode = args.consume("hexCode")

            if (!hexCode) {
                return message.sendErrorMessage("provideValidHexCode")
            }

            hexCode = hexCode.replaceAll("#", "")

            if (hexCode.length != 6) {
                return message.sendErrorMessage("provideValidHexCode")
            }

            let hexNumber;

            try {
                hexNumber = Number.parseInt(hexCode, 16)
            } catch {
                return message.sendErrorMessage("provideValidHexCode")
            }
            

            const r = hexNumber >> 16
            const g = (hexNumber >> 8) & 0xFF
            const b = hexNumber & 0xFF

            color = [r, g, b]

        } else if (subcommand == "image") {
            const attachment = args.consumeAttachment("image")

            if (!attachment) return message.sendErrorMessage("howDidThisHappen")

            if (attachment.size > 10*1024*1024) return message.sendErrorMessage("contentTooLarge10MB")
            
            const imageFetch = await fetch(attachment.proxyURL)

            if (!imageFetch.ok) return message.sendErrorMessage("invalidImage")

            const imageData = await imageFetch.arrayBuffer()

            try {

                const sharpImage = await sharp(Buffer.from(imageData));
                const { channels, dominant } = await sharpImage.stats()

                const { r, g, b } = dominant;

                color = [r, g, b]
            
            } catch {
                return message.sendErrorMessage("invalidImage")
            }
        }

        if (!color) {
            return message.sendErrorMessage("howDidThisHappen")

        }

        const blockPage = new BlockPage(client, color, count, version, noText, message.author.id)

        return message.send(blockPage.getEmbedWithButtons(message.author.tag))
        
    }
})
