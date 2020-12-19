import Discord from "discord.js"
import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import Roles from "../util/roles"

const VALID_IMAGE_SIZES = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096]

export default new Command({
    name: "avatar",
    aliases: ["pfp", "av"],
    description: "Get someone's profile picture.",
    permission: Roles.ANY,
    usage: "[user] [size] ['webp']",
    async run(this: Command, client: Client, message: Message, args: Args) {
        const user = (await args.consumeUser(true)) || message.author
        const size = Number(args.consumeIf(arg => !Number.isNaN(Number(arg)))) || 512
        const format = args.consumeIf("webp") || "png"
        if (!user)
            return message.channel.sendError(
                user === undefined
                    ? "You must provide a user to check!"
                    : "Couldn't find that user."
            )
        if (!VALID_IMAGE_SIZES.includes(size)) {
            const formatted = VALID_IMAGE_SIZES.join("`, `")
            return message.channel.sendError(
                `The avatar size must be one of: \`${formatted}\`.`
            )
        }

        const url = user.displayAvatarURL({
            size: size as Discord.ImageSize,
            format: format as Discord.AllowedImageFormat,
            dynamic: true
        })

        await message.channel.send({
            embed: {
                color: client.config.colors.info,
                description: `${user}'s profile picture:`,
                image: { url }
            }
        })
    }
})
