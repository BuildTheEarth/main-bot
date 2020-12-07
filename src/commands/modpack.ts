import Client from "../struct/Client"
import Message from "../struct/discord/Message"
import Args from "../struct/Args"
import Command from "../struct/Command"
import ModpackImage, { ModpackImageKey, VALID_KEYS } from "../entities/ModpackImage"
import Roles from "../util/roles"
import isURL from "../util/isURL"

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
    async run(this: Command, client: Client, message: Message, args: Args) {
        const subcommand = args.consume().toLowerCase()
        if (!this.subcommands.map(sub => sub.name).includes(subcommand))
            return message.channel.sendError("You must specify a subcommand.")

        if (subcommand === "list") {
            const images = (await ModpackImage.find()).sort((a, b) =>
                a.key === "logo" ? -1 : Number(a.key) - Number(b.key)
            )
            let queue = ""
            let store = ""

            for (const image of images) {
                const formatted = image.format(true)
                image.set === "queue"
                    ? (queue += "\n" + formatted)
                    : (store += "\n" + formatted)
            }

            message.channel.sendSuccess({
                author: { name: "Image list" },
                fields: [
                    { name: "Queue", value: queue || "*Empty.*" },
                    { name: "Store", value: store || "*Empty.*" }
                ]
            })
        } else if (subcommand === "set") {
            const [key, url, credit] = args.consumeRest(3)
            if (!key || !VALID_KEYS.includes(key))
                // prettier-ignore
                return message.channel.sendError("You must specify a valid key! (`1`—`5` or `queue`).")
            if (!url || !isURL(url))
                return message.channel.sendError("You must specify a valid URL!")
            if (!credit && key !== "logo")
                return message.channel.sendError("You must specify image credit!")

            const image = new ModpackImage()
            image.key = <ModpackImageKey>key
            image.set = "queue"
            image.url = url
            image.credit = key === "logo" ? null : credit
            await image.save()

            const header = key === "logo" ? "Saved logo!" : "Saved image!"
            message.channel.sendSuccess(header + "\n\n" + image.format())
        } else if (subcommand === "delete") {
            const key = args.consume()
            if (!key || !VALID_KEYS.includes(key))
                // prettier-ignore
                return message.channel.sendError("You must specify a valid key! (`1`—`5` or `queue`).")

            const image = await ModpackImage.findOne({ where: { key } })
            if (!image) return message.channel.sendError("Couldn't find that image!")

            await image.remove()
            message.channel.sendSuccess("Deleted image.")
        } else if (subcommand === "fetch") {
            const { body } = await ModpackImage.fetch()
            const codeblock = `\`\`\`${JSON.stringify(body, null, 2)}\`\`\``
            message.channel.sendSuccess(
                `Updated data locally! This was the raw JSON response:\n\n${codeblock}`
            )
        } else if (subcommand === "push") {
            const queue = await ModpackImage.find({ where: { set: "queue" } })
            const store = await ModpackImage.find({ where: { set: "store" } })

            for (const image of store) {
                const inQueue = queue.find(queueImage => queueImage.key === image.key)
                if (inQueue) await image.remove()
            }
            for (const image of queue) {
                image.set = "store"
                await image.save()
            }

            await ModpackImage.post(client.config.modpack)
            message.channel.sendSuccess("Pushed changes locally and to API!")
        } else if (subcommand === "url") {
            message.channel.sendSuccess(ModpackImage.API_URL)
        }
    }
})
