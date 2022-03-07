import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import ModpackImage, { ModpackImageKey } from "../entities/ModpackImage.entity"
import Roles from "../util/roles.util"
import CommandMessage from "../struct/CommandMessage"
import JSON5 from "json5"
import fetch from "node-fetch"
import sizeOf from "buffer-image-size"
import { isURL } from "@buildtheearth/bot-utils"

export default new Command({
    name: "modpack",
    aliases: ["mp"],
    description: "Manage the modpack's background images.",
    permission: Roles.MANAGER,
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
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const subcommand = args.consumeSubcommand().toLowerCase()
        if (!this.subcommands.map(sub => sub.name).includes(subcommand))
            return client.response.sendError(message, "You must specify a subcommand.")

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

            client.response.sendSuccess(message, {
                author: { name: "Image list" },
                fields: [
                    { name: "Queue", value: queue },
                    { name: "Store", value: store }
                ]
            })
        } else if (subcommand === "set") {
            const [key, url, credit] = [
                args.consume("key"),
                args.consume("url"),
                args.consume("credit")
            ]
            if (!key || !ModpackImage.isValidKey(key))
                return client.response.sendError(message, "You must specify a valid key!")
            if (!url || !isURL(url))
                return client.response.sendError(message, "You must specify a valid URL!")
            if (!credit && key !== "logo")
                return client.response.sendError(
                    message,
                    "You must specify image credit!"
                )

            await message.continue()

            let buff: Buffer
            try {
                const response = await fetch(url)
                const arrayBuffer = await response.arrayBuffer()
                buff = Buffer.from(arrayBuffer)
            } catch {
                return client.response.sendError(
                    message,
                    client.messages.requestIncomplete
                )
            }
            const dimensions = sizeOf(buff)
            if (dimensions.width / dimensions.height !== 16 / 9)
                return client.response.sendError(message, client.messages.not16To9)

            const image = new ModpackImage()
            image.key = key as ModpackImageKey
            image.set = "queue"
            image.url = url
            image.credit = key === "logo" ? null : credit
            await image.save()

            const header = key === "logo" ? "Saved logo!" : "Saved image!"
            client.response.sendSuccess(message, header + "\n\n" + image.format())
        } else if (subcommand === "delete") {
            const key = args.consume("key")
            if (!key || !ModpackImage.isValidKey(key))
                return client.response.sendError(message, "You must specify a valid key!")

            await message.continue()

            const image = await ModpackImage.findOne({ key: key as ModpackImageKey })
            if (!image)
                return client.response.sendError(message, "Couldn't find that image!")

            await image.remove()
            client.response.sendSuccess(message, "Deleted image.")
        } else if (subcommand === "fetch") {
            await message.continue()

            const { body } = await ModpackImage.fetch()
            const code = `\`\`\`${JSON5.stringify(body, null, 2)}\`\`\``
            client.response.sendSuccess(
                message,
                `Updated data! Raw JSON response:\n\n${code}`
            )
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

            await ModpackImage.post(client.config.modpackAuth)
            client.response.sendSuccess(message, "Pushed changes locally and to API!")
        } else if (subcommand === "url") {
            client.response.sendSuccess(message, ModpackImage.API_URL)
        }
    }
})
