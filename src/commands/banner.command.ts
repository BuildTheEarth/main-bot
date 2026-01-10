import BotClient from "../struct/BotClient.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import BannerImage from "../entities/BannerImage.entity.js"

import CommandMessage from "../struct/CommandMessage.js"
import { hexToNum, quote } from "@buildtheearth/bot-utils"

export default new Command({
    name: "banner",
    aliases: [],
    description: "Manage the banner queue.",
    permission: [
        globalThis.client.roles.MANAGER,
        globalThis.client.roles.BUILDER_COUNCIL
    ],
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
    async run(this: Command, client: BotClient, message: CommandMessage, args: Args) {
        const subcommand = args.consumeSubcommandIf(
            this.subcommands?.map(sub => sub.name)
        )

        if (subcommand === "add") {
            await message.showModal("banner")
        } else if (subcommand === "delete") {
            const id = args.consume("id")
            if (!id) return message.sendErrorMessage("noBannerID")

            await message.continue()

            const banner = await BannerImage.findOne(Number(id))
            if (!banner) return message.sendErrorMessage("bannerDosentExist")

            await banner.remove()
            await message.sendSuccessMessage("removedBanner", banner.id)
        } else if (subcommand === "queue") {
            await message.continue()
            const banners = await BannerImage.find()
            const formatted = banners.map(banner => banner.format()).join("\n")
            return message.sendSuccess({
                author: { name: message.getMessage("bannerQueue") },
                description: formatted || "*Empty.*"
            })
        } else if (subcommand === "show") {
            const id = args.consume("id")
            if (!id) return message.sendErrorMessage("noBannerID")

            await message.continue()

            const banner = await BannerImage.findOne(Number(id))
            if (!banner) return message.sendErrorMessage("noBanner")

            await message.send({
                embeds: [
                    {
                        author: { name: `Banner #${banner.id}` },
                        color: hexToNum(client.config.colors.info),
                        description: banner.description
                            ? quote(banner.description)
                            : undefined,
                        fields: [{ name: "Credit", value: banner.credit }],
                        image: banner
                    }
                ]
            })
        } else if (subcommand === "cycle") {
            await message.continue()
            BannerImage.cycle(client)
            await message.sendSuccessMessage("forcedBannerCycle")
        }
    }
})
