import Discord from "discord.js"
import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import humanizeArray from "../util/humanizeArray"
import hexToRGB from "../util/hexToRGB"
import CommandMessage from "../struct/CommandMessage"

const VALID_IMAGE_SIZES = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096]

export default new Command({
    name: "avatar",
    aliases: ["pfp", "av"],
    description: "Get someone's profile picture.",
    permission: Roles.ANY,
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
            optionType: "STRING",
            choices: ["webp"]
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const user = (await args.consumeUser("user", true)) || message.member
        const size =
            Number(args.consumeIf(arg => !Number.isNaN(Number(arg)), "size")) || 512
        const format = args.consumeIf("webp", "webp") || "png"
        if (!user)
            return client.response.sendError(
                message,
                user === undefined
                    ? "You must provide a user to check!"
                    : "Couldn't find that user."
            )
        if (!VALID_IMAGE_SIZES.includes(size))
            return client.response.sendError(
                message,
                `The avatar size must be one of ${humanizeArray(VALID_IMAGE_SIZES)}.`
            )

        await message.continue()

        const url = user.displayAvatarURL({
            size: size as Discord.AllowedImageSize,
            format: format as Discord.AllowedImageFormat,
            dynamic: true
        })

        await message.send({
            embeds: [
                {
                    color: hexToRGB(client.config.colors.info),
                    description: `${user}'s profile picture:`,
                    image: { url }
                }
            ]
        })
    }
})
