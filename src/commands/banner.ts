import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import BannerImage from "../entities/BannerImage"
import Roles from "../util/roles"
import quote from "../util/quote"
import hexToRGB from "../util/hexToRGB"
import Discord from "discord.js"

export default new Command({
    name: "banner",
    aliases: [],
    description: "Manage the banner queue.",
    permission: [Roles.MANAGER, Roles.BUILDER_COUNCIL],
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
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const subcommand = args.consumeIf(this.subcommands.map(sub => sub.name))

        if (subcommand === "add" || !subcommand) {
            args.separator = "|"
            const image = args.consumeImage()
            const [location, credit, description] = args.consume(3)

            let missing: string
            if (!image) missing = "the banner image"
            else if (!location) missing = "the location of the build"
            else if (!credit) missing = "the image credit"
            if (missing)
                return client.channel.sendError(
                    message.channel,
                    `You must provide ${missing}!`
                )
            if (description?.length > 512)
                return client.channel.sendError(
                    message.channel,
                    "That description is too long! (max. 512 characters)."
                )

            const banner = new BannerImage()
            banner.url = image
            banner.location = location
            banner.credit = credit
            if (description) banner.description = description
            await banner.save()

            await client.channel.sendSuccess(
                message.channel,
                `Queued the banner! (**#${banner.id}**).`
            )
        } else if (subcommand === "delete") {
            const id = args.consume()
            if (!id)
                return client.channel.sendError(
                    message.channel,
                    "You must provide the banner ID."
                )
            const banner = await BannerImage.findOne(Number(id))
            if (!banner)
                return client.channel.sendError(
                    message.channel,
                    "That banner doesn't exist."
                )

            await banner.remove()
            await client.channel.sendSuccess(
                message.channel,
                `Removed banner **#${id}** from the queue.`
            )
        } else if (subcommand === "queue") {
            const banners = await BannerImage.find()
            const formatted = banners.map(banner => banner.format()).join("\n")
            return client.channel.sendSuccess(message.channel, {
                author: { name: "Banner queue" },
                description: formatted || "*Empty.*"
            })
        } else if (subcommand === "show") {
            const id = args.consume()
            if (!id)
                return client.channel.sendError(
                    message.channel,
                    "You must provide the banner ID."
                )
            const banner = await BannerImage.findOne(Number(id))
            if (!banner)
                return client.channel.sendError(
                    message.channel,
                    "That banner doesn't exist."
                )

            await message.channel.send({
                embeds: [
                    {
                        author: { name: `Banner #${banner.id}` },
                        color: hexToRGB(client.config.colors.info),
                        description: banner.description
                            ? quote(banner.description)
                            : null,
                        fields: [{ name: "Credit", value: banner.credit }],
                        image: banner
                    }
                ]
            })
        } else if (subcommand === "cycle") {
            BannerImage.cycle(client)
            await client.channel.sendSuccess(
                message.channel,
                "Forced a banner queue cycle."
            )
        }
    }
})
