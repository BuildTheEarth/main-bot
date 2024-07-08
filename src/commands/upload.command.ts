import Client from "../struct/Client.js"
import Args from "../struct/Args.js"
import Command from "../struct/Command.js"

import fetch, {FormData} from "node-fetch"

import CommandMessage from "../struct/CommandMessage.js"
import { noop } from "@buildtheearth/bot-utils"

export default new Command({
    name: "upload",
    aliases: [],
    description: "Upload images to the s3 bucket.",
    permission: [globalThis.client.roles.MANAGER, globalThis.client.roles.BUILDER_COUNCIL],
    args: [
        {
            name: "image",
            description: "Image to upload",
            required: true,
            optionType: "ATTACHMENT"
        },
    ],
    async run(this: Command, client: Client, message: CommandMessage, args: Args) {
        const attachment = args.consumeAttachment("image")
        if (!attachment) return await message.sendErrorMessage("noImage")

        if (!attachment.contentType) return await message.sendErrorMessage("noImage")

        if (!["image/png", "image/jpg", "image/jpeg", "image/gif"].includes(attachment.contentType)) return await message.sendErrorMessage("invalidImage")

        const fileName = attachment.name

        await message.continue()

        const imageFetch = await fetch(attachment.url).catch(noop)

        if (!imageFetch) return await message.sendErrorMessage("httpError")

        const imageBlob = await imageFetch.blob()

        const formData = new FormData()

        formData.append("image", imageBlob, fileName)

        const resp = await fetch("https://api.buildtheearth.net/api/v1/upload", {
            method: "POST",
            body: formData,
            headers: {
                "Authorization": `Bearer ${client.config.websiteToken}`
            }
        });

        if (resp.status != 200) return await message.sendErrorMessage("httpError")
 
        const body = await resp.json() as {src: string}

        const url = body.src

        if (!url) return await message.sendErrorMessage("httpError")

        return await message.sendSuccess(`Here is the image URL: \`${url}\``)
    }
})
