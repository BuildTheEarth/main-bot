import typeorm from "typeorm"
import { APIEmbed } from "discord.js"
import BotClient from "../struct/BotClient.js"
import languages from "../struct/client/iso6391.js"
import { hexToNum } from "@buildtheearth/bot-utils"
import unicode from "./transformers/unicode.transformer.js"
import Cron from "croner"

@typeorm.Entity({ name: "snippets" })
export default class Snippet extends typeorm.BaseEntity {
    @typeorm.PrimaryGeneratedColumn()
    id!: number

    @typeorm.Column({ length: 32 })
    name!: string

    @typeorm.Column({ length: 4 })
    language!: string

    @typeorm.Column({ length: 2000, transformer: unicode })
    body!: string

    @typeorm.Column()
    type!: "snippet" | "rule" | "team"

    @typeorm.Column("simple-array")
    aliases!: string[]

    public static teams: string[] = []

    displayEmbed(client: BotClient): APIEmbed {
        const language = languages.getName(this.language)
        return {
            color: hexToNum(client.config.colors.success),
            author: { name: `'${this.name}' snippet in ${language}` },
            description: this.body
        }
    }

    public static async updaterInit(): Promise<Cron> {
        const tempTeams = await Snippet.find({ where: { type: "team" } })
        const tempArr = tempTeams.map(e => e.name)
        tempTeams.forEach(e => tempArr.push(...e.aliases))
        Snippet.teams = tempArr

        return new Cron("*/10 * * * *", async () => {
            const tempTeams = await Snippet.find({ where: { type: "team" } })
            const tempArr = tempTeams.map(e => e.name)
            tempTeams.forEach(e => tempArr.push(...e.aliases))
            Snippet.teams = tempArr
        })
    }
}
