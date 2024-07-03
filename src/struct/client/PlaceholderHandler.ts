import { trimSides } from "@buildtheearth/bot-utils"
import Placeholder from "../../entities/Placeholder.entity.js"
import Client from "../Client.js"
import iso6391 from "./iso6391.js"
import { Collection } from "discord.js"

export default class PlaceholderHandler {
    client: Client

    constructor(client: Client) {
        this.client = client
    }

    cache = new Collection<string, Placeholder>()

    async addPlaceholder(name: string, language: string, body: string): Promise<void> {
        if (this.cache.has(name + " " + language)) return
        if (!iso6391.validate(language)) return

        const placeholder = new Placeholder()

        placeholder.name = name
        placeholder.language = language
        placeholder.body = body

        await placeholder.save()

        this.cache.set(name + " " + language, placeholder)
    }

    async editPlaceholder(
        name: string,
        language: string,
        newBody: string
    ): Promise<void> {
        if (this.cache.has(name + " " + language)) return
        if (!iso6391.validate(language)) return

        const placeholder = await Placeholder.findOne({ name: name, language: language })

        if (placeholder) {
            placeholder.body = newBody
            await placeholder.save()
        }
        if (placeholder) this.cache.set(name + " " + language, placeholder)
    }

    async deletePlaceholder(name: string, language: string): Promise<void> {
        if (this.cache.has(name + " " + language)) return
        if (!iso6391.validate(language)) return

        const placeholder = await Placeholder.findOne({ name: name, language: language })

        if (placeholder) {
            await placeholder.remove()
        }
        this.cache.delete(name + " " + language)
    }

    replacePlaceholders(text: string): string {
        if (!text) return text

        return text.replaceAll(
            /{{.*?}}/g,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            (substring: string, ..._args: unknown[]): string => {
                let trimmedString = trimSides(substring, "{{", "}}").trim()
                if (trimmedString.split(" ").length > 2) return substring
                if (trimmedString.split(" ").length == 1) trimmedString += " en"

                return this.cache.get(trimmedString)?.body || substring
            }
        )
    }
}
