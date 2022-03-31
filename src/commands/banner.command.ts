import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import BannerImage from "../entities/BannerImage.entity.js"
import Roles from "../util/roles.util.js"
import CommandMessage from "../struct/CommandMessage.js"
import { hexToRGB, quote } from "@buildtheearth/bot-utils"
import Discord from "discord.js"

export default new Command({
    name: "banner",
    aliases: [],
    description: "Manage the banner queue.",
    permission: [Roles.MANAGER, Roles.BUILDER_COUNCIL],
    subcommands: [
        {
            name: "add",
            description: "Add a banner to the queue."
        },
        {
            name: "delete",
            description: "Delete a banner from the queue.",
            args: [
                {
                    name: "id",
                    description: "Queued banner ID",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "queue",
            description: "List the current banner queue."
        },
        {
            name: "show",
            description: "Show info on a specific queued banner.",
            args: [
                {
                    name: "id",
                    description: "Queued banner ID",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "cycle",
            description: "Force the banner queue to cycle to the next banner."
        }
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const subcommand = args.consumeSubcommandIf(this.subcommands.map(sub => sub.name))

        if (subcommand === "add") {
            await message.showModal("banner")
        } else if (subcommand === "delete") {
            const id = args.consume("id")
            if (!id)
                return client.response.sendError(message, message.messages.noBannerID)

            await message.continue()

            const banner = await BannerImage.findOne(Number(id))
            if (!banner)
                return client.response.sendError(message, "That banner doesn't exist.")

            await banner.remove()
            await client.response.sendSuccess(
                message,
                `Removed banner **#${id}** from the queue.`
            )
        } else if (subcommand === "queue") {
            await message.continue()
            const banners = await BannerImage.find()
            const formatted = banners.map(banner => banner.format()).join("\n")
            return client.response.sendSuccess(message, {
                author: { name: "Banner queue" },
                description: formatted || "*Empty.*"
            })
        } else if (subcommand === "show") {
            const id = args.consume("id")
            if (!id)
                return client.response.sendError(message, message.messages.noBannerID)

            await message.continue()

            const banner = await BannerImage.findOne(Number(id))
            if (!banner)
                return client.response.sendError(message, message.messages.noBanner)

            await message.send({
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
            await message.continue()
            BannerImage.cycle(client)
            await client.response.sendSuccess(message, "Forced a banner queue cycle.")
        }
    }
})
