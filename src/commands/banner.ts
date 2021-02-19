import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import BannerImage from "../entities/BannerImage"
import Roles from "../util/roles"
import quote from "../util/quote"

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
            usage: "<image URL | attachment> | <location> | <credit> | [description]"
        },
        {
            name: "delete",
            description: "Delete a banner from the queue.",
            usage: "<id>"
        },
        {
            name: "queue",
            description: "List the current banner queue.",
            usage: ""
        },
        {
            name: "show",
            description: "Show info on a specific queued banner.",
            usage: "<id>"
        },
        {
            name: "cycle",
            description: "Force the banner queue to cycle to the next banner.",
            usage: ""
        }
    ],
    async run(this: Command, client: Client, message: Message, args: Args) {
        const subcommand = args.consumeIf(this.subcommands.map(sub => sub.name))

        if (subcommand === "add" || !subcommand) {
            args.separator = "|"
            const image = args.consumeImage()
            const [location, credit, description] = args.consume(3)

            let missing: string
            if (!image) missing = "the banner image"
            else if (!location) missing = "the location of the build"
            else if (!credit) missing = "the image credit"
            if (missing) return message.channel.sendError(`You must provide ${missing}!`)
            if (description?.length > 512)
                return message.channel.sendError(
                    "That description is too long! (max. 512 characters)."
                )

            const banner = new BannerImage()
            banner.url = image
            banner.location = location
            banner.credit = credit
            if (description) banner.description = description
            await banner.save()

            await message.channel.sendSuccess(`Queued the banner! (**#${banner.id}**).`)
        } else if (subcommand === "delete") {
            const id = args.consume()
            if (!id) return message.channel.sendError("You must provide the banner ID.")
            const banner = await BannerImage.findOne(Number(id))
            if (!banner) return message.channel.sendError("That banner doesn't exist.")

            await banner.remove()
            await message.channel.sendSuccess(`Removed banner **#${id}** from the queue.`)
        } else if (subcommand === "queue") {
            const banners = await BannerImage.find()
            const formatted = banners.map(banner => banner.format()).join("\n")
            return message.channel.sendSuccess({
                author: { name: "Banner queue" },
                description: formatted || "*Empty.*"
            })
        } else if (subcommand === "show") {
            const id = args.consume()
            if (!id) return message.channel.sendError("You must provide the banner ID.")
            const banner = await BannerImage.findOne(Number(id))
            if (!banner) return message.channel.sendError("That banner doesn't exist.")

            await message.channel.send({
                embed: {
                    author: { name: `Banner #${banner.id}` },
                    color: client.config.colors.info,
                    description: banner.description ? quote(banner.description) : null,
                    fields: [{ name: "Credit", value: banner.credit }],
                    image: banner
                }
            })
        } else if (subcommand === "cycle") {
            BannerImage.cycle(client)
            await message.channel.sendSuccess("Forced a banner queue cycle.")
        }
    }
})
