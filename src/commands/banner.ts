import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import BannerImage from "../entities/BannerImage"
import Roles from "../util/roles"

export default new Command({
    name: "banner",
    aliases: [],
    description: "Manage the banner queue.",
    permission: Roles.MANAGER,
    usage: "",
    subcommands: [
        {
            name: "add",
            description: "Add a banner to the queue.",
            usage: "<image URL | attachment> | <location> | <builders> | [description]"
        },
        {
            name: "queue",
            description: "List the current banner queue.",
            usage: ""
        }
    ],
    async run(this: Command, _client: Client, message: Message, args: Args) {
        const subcommand = args.consumeIf(this.subcommands.map(sub => sub.name))

        if (subcommand === "add" || !subcommand) {
            args.separator = "|"
            const image = args.consumeImage()
            const location = args.consume()
            const builders = Array.from(args.consume().match(/\d{18}/g) || [])
            const description = args.consume()

            let missing: string
            if (!image) missing = "the banner image"
            else if (!location) missing = "the location of the build"
            else if (!builders.length) missing = "a list of builders"
            if (missing) return message.channel.sendError(`You must provide ${missing}!`)

            const banner = new BannerImage()
            banner.url = image
            banner.location = location
            banner.builders = builders
            if (description) banner.description = description
            await banner.save()

            await message.channel.sendSuccess(
                `Added the banner to the queue! (**#${banner.id}**).`
            )
        } else if (subcommand === "queue") {
            const banners = await BannerImage.find()
            const formatted = banners.map(banner => banner.format()).join("\n")
            return message.channel.sendSuccess({
                author: { name: "Banner queue" },
                description: formatted || "*Empty.*"
            })
        }
    }
})
