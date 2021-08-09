import Client from "../struct/Client"
import Args from "../struct/Args"
import Command from "../struct/Command"
import ModpackImage, { ModpackImageKey } from "../entities/ModpackImage"
import Roles from "../util/roles"
import isURL from "../util/isURL"
import Discord from "discord.js"

export default new Command({
    name: "modpack",
    aliases: ["mp"],
    description: "Manage the modpack's background images.",
    permission: Roles.MANAGER,
    usage: "",
    subcommands: [
        {
            name: "list",
            description: "List images on the queue and store.",
            usage: ""
        },
        {
            name: "set",
            description: "Add an image to the queue.",
            usage: "<key> <url> <credit>"
        },
        {
            name: "delete",
            description: "Delete an image from the queue.",
            usage: "<key>"
        },
        {
            name: "fetch",
            description: "Force-fetch the data from the API.",
            usage: ""
        },
        {
            name: "push",
            description: "Push the queue to the store.",
            usage: ""
        },

        {
            name: "url",
            description: "Get the URL to the modpack API.",
            usage: ""
        }
    ],
    async run(this: Command, client: Client, message: Discord.Message, args: Args) {
        const subcommand = args.consume().toLowerCase()
        if (!this.subcommands.map(sub => sub.name).includes(subcommand))
            return client.channel.sendError(
                message.channel,
                "You must specify a subcommand."
            )

        if (subcommand === "list") {
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

            client.channel.sendSuccess(message.channel, {
                author: { name: "Image list" },
                fields: [
                    { name: "Queue", value: queue },
                    { name: "Store", value: store }
                ]
            })
        } else if (subcommand === "set") {
            const [key, url, credit] = args.consumeRest(3)
            if (!key || !ModpackImage.isValidKey(key))
                return client.channel.sendError(
                    message.channel,
                    "You must specify a valid key!"
                )
            if (!url || !isURL(url))
                return client.channel.sendError(
                    message.channel,
                    "You must specify a valid URL!"
                )
            if (!credit && key !== "logo")
                return client.channel.sendError(
                    message.channel,
                    "You must specify image credit!"
                )

            const image = new ModpackImage()
            image.key = key as ModpackImageKey
            image.set = "queue"
            image.url = url
            image.credit = key === "logo" ? null : credit
            await image.save()

            const header = key === "logo" ? "Saved logo!" : "Saved image!"
            client.channel.sendSuccess(message.channel, header + "\n\n" + image.format())
        } else if (subcommand === "delete") {
            const key = args.consume()
            if (!key || !ModpackImage.isValidKey(key))
                return client.channel.sendError(
                    message.channel,
                    "You must specify a valid key!"
                )

            const image = await ModpackImage.findOne({ key: key as ModpackImageKey })
            if (!image)
                return client.channel.sendError(
                    message.channel,
                    "Couldn't find that image!"
                )

            await image.remove()
            client.channel.sendSuccess(message.channel, "Deleted image.")
        } else if (subcommand === "fetch") {
            const { body } = await ModpackImage.fetch()
            const code = `\`\`\`${JSON.stringify(body, null, 2)}\`\`\``
            client.channel.sendSuccess(
                message.channel,
                `Updated data! Raw JSON response:\n\n${code}`
            )
        } else if (subcommand === "push") {
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
            client.channel.sendSuccess(
                message.channel,
                "Pushed changes locally and to API!"
            )
        } else if (subcommand === "url") {
            client.channel.sendSuccess(message.channel, ModpackImage.API_URL)
        }
    }
})
