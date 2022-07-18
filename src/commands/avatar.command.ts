import Discord from "discord.js"
import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"

import CommandMessage from "../struct/CommandMessage.js"
import { hexToNum, hexToRGB, humanizeArray } from "@buildtheearth/bot-utils"

const VALID_IMAGE_SIZES = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096]

export default new Command({
    name: "avatar",
    aliases: ["av"],
    description: "Get someone's profile picture.",
    permission: globalThis.client.roles.ANY,
    args: [
        {
            name: "user",
            description: "User to get avatar of.",
            required: false,
            optionType: "USER"
        },
        {
            name: "size",
            description: "Optional arg to get image in certain size.",
            required: false,
            optionType: "NUMBER",
            choices: VALID_IMAGE_SIZES
        },
        {
            name: "webp",
            description: "Optional arg to get as webp.",
            required: false,
            optionType: "BOOLEAN"
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const user = (await args.consumeUser("user")) || message.member
        const size =
            Number(args.consumeIf(arg => !Number.isNaN(Number(arg)), "size")) || 512
        let format = args.consumeBoolean("webp") || "png"
        if (format === true) {
            format = "webp"
        }
        if (!user)
            return message.sendErrorMessage(user === undefined ? "noUser" : "invalidUser")
        if (!VALID_IMAGE_SIZES.includes(size))
            return message.sendErrorMessage(
                "invalidAvatarSize",
                `${humanizeArray(VALID_IMAGE_SIZES)}.`
            )

        await message.continue()

        const url = user.displayAvatarURL({
            size: size as 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096 | undefined,
            forceStatic: false,
            extension: format as "webp" | "png" | "jpg" | "jpeg" | "gif" | undefined
        })

        await message.send({
            embeds: [
                {
                    color: hexToNum(client.config.colors.info),
                    description: `${user}'s profile picture:`,
                    image: { url }
                }
            ]
        })
    }
})
