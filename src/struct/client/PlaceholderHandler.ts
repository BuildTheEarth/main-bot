/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Placeholder from "../../entities/Placeholder.entity"
import Client from "../Client"
import iso6391 from "./iso6391"
import trimSides from "../../util/trimSides.util"

export default class PlaceholderHandler {
    client: Client

    constructor(client: Client) {
        this.client = client
    }

    cache = new Map<string, Placeholder>()

    async addPlaceholder(name: string, language: string, body: string) {
        if (this.cache.has(name + " " + language)) return
        if (!iso6391.validate(language)) return

        const placeholder = new Placeholder()

        placeholder.name = name
        placeholder.language = language
        placeholder.body = body

        await placeholder.save()

        this.cache[name + " " + language] = placeholder
    }

    async editPlaceholder(name: string, language: string, newBody: string) {
        if (this.cache.has(name + " " + language)) return
        if (!iso6391.validate(language)) return

        const placeholder = await Placeholder.findOne({ name: name, language: language })

        if (placeholder) {
            placeholder.body = newBody
            await placeholder.save()
        }
        this.cache[name + " " + language] = placeholder
    }

    async deletePlaceholder(name: string, language: string) {
        if (this.cache.has(name + " " + language)) return
        if (!iso6391.validate(language)) return

        const placeholder = await Placeholder.findOne({ name: name, language: language })

        if (placeholder) {
            await placeholder.remove()
        }
        delete this.cache[name + " " + language]
    }

    replacePlaceholders(text: string) {
        if (!text) return text

        return text.replaceAll(
            /{{.*?}}/g,
            (substring: string, ...args: any[]): string => {
                let trimmedString = trimSides(substring, "{{", "}}").trim()
                if (trimmedString.split(" ").length > 2) return substring
                if (trimmedString.split(" ").length == 1) trimmedString += " en"

                return this.cache[trimmedString]?.body || substring
            }
        )
    }
}
