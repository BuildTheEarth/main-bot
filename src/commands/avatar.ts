import Discord from "discord.js"
import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"
import humanizeArray from "../util/humanizeArray"
import hexToRGB from "../util/hexToRGB"

const VALID_IMAGE_SIZES = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096]

export default new Command({
    name: "avatar",
    aliases: ["pfp", "av"],
    description: "Get someone's profile picture.",
    permission: Roles.ANY,
    usage: "[user] [size] ['webp']",
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const user = (await args.consumeUser(true)) || message.author
        const size = Number(args.consumeIf(arg => !Number.isNaN(Number(arg)))) || 512
        const format = args.consumeIf("webp") || "png"
        if (!user)
            return client.channel.sendError(
                message.channel,
                user === undefined
                    ? "You must provide a user to check!"
                    : "Couldn't find that user."
            )
        if (!VALID_IMAGE_SIZES.includes(size))
            return client.channel.sendError(
                message.channel,
                `The avatar size must be one of ${humanizeArray(VALID_IMAGE_SIZES)}.`
            )

        const url = user.displayAvatarURL({
            size: size as Discord.AllowedImageSize,
            format: format as Discord.AllowedImageFormat,
            dynamic: true
        })

        await message.channel.send({
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
