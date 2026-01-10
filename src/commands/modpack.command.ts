import BotClient from "../struct/BotClient.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"
import ModpackImage, { ModpackImageKey } from "../entities/ModpackImage.entity.js"

import CommandMessage from "../struct/CommandMessage.js"
import fetch from "node-fetch"
import sizeOf from "buffer-image-size"
import { hexToNum, isURL } from "@buildtheearth/bot-utils"

export default new Command({
    name: "modpack",
    aliases: ["mp"],
    description: "Manage the modpack's background images.",
    permission: [
        globalThis.client.roles.MANAGER,
        globalThis.client.roles.BUILDER_COUNCIL
    ],
    subcommands: [
        {
            name: "list",
            description: "List images on the queue and store."
        },
        {
            name: "set",
            description: "Add an image to the queue.",
            args: [
                {
                    name: "key",
                    description: "Image Key.",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "url",
                    description: "Image Url.",
                    required: true,
                    optionType: "STRING"
                },
                {
                    name: "credit",
                    description: "Image Credit.",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "delete",
            description: "Delete an image from the queue.",
            args: [
                {
                    name: "key",
                    description: "Image Key.",
                    required: true,
                    optionType: "STRING"
                }
            ]
        },
        {
            name: "fetch",
            description: "Force-fetch the data from the API."
        },
        {
            name: "push",
            description: "Push the queue to the store."
        },

        {
            name: "url",
            description: "Get the URL to the modpack API."
        }
    ],
    async run(this: Command, client: BotClient, message: CommandMessage, args: Args) {
        const subcommand = args.consumeSubcommand().toLowerCase()
        if (!this.subcommands?.map(sub => sub.name).includes(subcommand))
            return message.sendErrorMessage("specifySubcommand")

        if (subcommand === "list") {
            await message.continue()

            const sort = (a: ModpackImage, b: ModpackImage) =>
                a.key === "logo" ? -1 : Number(a.key) - Number(b.key)
            const images = (await ModpackImage.find()).sort(sort)
            const format = (set: "queue" | "store") =>
                images
                    .filter(image => image.set === set)
                    .map(image => image.format(true))
                    .join("\n") || "*Empty.*"

            const queue = format("queue")
            const store = format("store")

            message.send({
                embeds: [
                    {
                        author: { name: "Image list" },
                        description: "### Queue\n" + queue,
                        color: hexToNum(client.config.colors.success)
                    },
                    {
                        description: "### Store\n" + store,
                        color: hexToNum(client.config.colors.success)
                    }
                ]
            })
        } else if (subcommand === "set") {
            const [key, url, credit] = [
                args.consume("key"),
                args.consume("url"),
                args.consume("credit")
            ]
            if (!key || !ModpackImage.isValidKey(key))
                return message.sendErrorMessage("specifyValidKey")
            if (!url || !isURL(url)) return message.sendErrorMessage("specifyValidURL")
            if (!credit && key !== "logo")
                return message.sendErrorMessage("specifyImageCredit")
            await message.continue()

            let buff: Buffer
            let response: Awaited<ReturnType<typeof fetch>>
            try {
                response = await fetch(url)
                const arrayBuffer = await response.arrayBuffer()
                buff = Buffer.from(arrayBuffer)
            } catch {
                return message.sendErrorMessage("requestIncomplete")
            }

            const isImage = response.headers.get("content-type")?.startsWith("image/")

            if (!isImage) return message.sendErrorMessage("pleaseImage")

            const dimensions = sizeOf(buff)
            if ((dimensions.width / dimensions.height !== 16 / 9) && key !== "logo")
                return message.sendErrorMessage("not16To9")

            const image = new ModpackImage()
            image.key = key as ModpackImageKey
            image.set = "queue"
            image.url = url
            image.credit = key === "logo" ? undefined : credit
            await image.save()

            const header = key === "logo" ? "Saved logo!" : "Saved image!"
            message.sendSuccess(header + "\n\n" + image.format())
        } else if (subcommand === "delete") {
            const key = args.consume("key")
            if (!key || !ModpackImage.isValidKey(key))
                return message.sendErrorMessage("specifyValidKey")

            await message.continue()

            const image = await ModpackImage.findOne({ key: key as ModpackImageKey })
            if (!image) return message.sendErrorMessage("couldNotFindImage")

            await image.remove()
            await message.sendSuccessMessage("deletedImage")
        } else if (subcommand === "fetch") {
            await message.continue()

            const { body } = await ModpackImage.fetch()
            const code = `\`\`\`${JSON.stringify(body, null, 2)}\`\`\``
            await message.sendSuccessMessage("updatedJsonData", code)
        } else if (subcommand === "push") {
            await message.continue()

            const queue = await ModpackImage.find({ set: "queue" })
            const store = await ModpackImage.find({ set: "store" })

            for (const image of store) {
                const inQueue = queue.find(queueImage => queueImage.key === image.key)
                if (inQueue) await image.remove()
            }
            for (const image of queue) {
                image.set = "store"
                await image.save()
            }

            await ModpackImage.post(client.config.websiteToken)
            await message.sendSuccessMessage("pushedChanges")
        } else if (subcommand === "url") {
            await message.sendSuccess(ModpackImage.API_URL)
        }
    }
})
