import typeorm from "typeorm"
import Discord from "discord.js"
import Client from "../struct/Client.js"
import languages from "../struct/client/iso6391.js"
import { hexToNum, hexToRGB } from "@buildtheearth/bot-utils"
import unicode from "./transformers/unicode.transformer.js"

@typeorm.Entity({ name: "placeholders" })
export default class Placeholder extends typeorm.BaseEntity {
    @typeorm.PrimaryGeneratedColumn()
    id!: number

    @typeorm.Column({ length: 32 })
    name!: string

    @typeorm.Column({ length: 4 })
    language!: string

    @typeorm.Column({ length: 2000, transformer: unicode })
    body!: string

    displayEmbed(client: Client): Discord.APIEmbed {
        const language = languages.getName(this.language)
        return {
            color: hexToNum(client.config.colors.success),
            author: { name: `'${this.name}' placeholder in ${language}` },
            description: this.body
        }
    }

    static async loadPlaceholders(): Promise<Map<string, Placeholder>> {
        const values = await this.find()
        const placeholders = new Map<string, Placeholder>()
        values.forEach(word => {
            placeholders.set(word.name + " " + word.language, word)
        })
        return placeholders
    }
}
