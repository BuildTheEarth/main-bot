import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from "typeorm"
import Discord from "discord.js"
import Client from "../struct/Client"
import languages from "../util/patchedISO6391"
import hexToRGB from "../util/hexToRGB"

@Entity({ name: "snippets" })
export default class Snippet extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 32 })
    name: string

    @Column({ length: 4 })
    language: string

    @Column({ length: 2000 })
    body: string

    @Column()
    type: "snippet" | "rule" | "team"

    @Column("simple-array")
    aliases: string[]

    displayEmbed(client: Client): Discord.MessageEmbedOptions {
        const language = languages.getName(this.language)
        return {
            color: hexToRGB(client.config.colors.success),
            author: { name: `'${this.name}' snippet in ${language}` },
            description: this.body
        }
    }
}
