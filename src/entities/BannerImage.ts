import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    DeleteDateColumn,
    BaseEntity
} from "typeorm"
import Discord from "discord.js"
import Client from "../struct/Client"
import TextChannel from "../struct/discord/TextChannel"
import quote from "../util/quote"

@Entity({ name: "banner_images" })
export default class BannerImage extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    url: string

    @Column("simple-array")
    builders: string[]

    @Column()
    location: string

    @Column({ nullable: true })
    description?: string

    @DeleteDateColumn({ name: "deleted_at" })
    deletedAt?: Date

    format(): string {
        const builders = this.builders.map(id => `<@${id}>`).join(", ")
        return `**#${this.id}:** [Link](${this.url}), by ${builders}`
    }

    static async cycle(client: Client): Promise<void> {
        const main = client.guilds.cache.get(client.config.guilds.main)
        if (!main.features.includes("BANNER")) return
        const next = await this.findOne()

        if (!next) {
            client.logger.warn("[BannerImage] Queue is empty; cannot update banner.")
            return
        }

        await main.setBanner(next.url)
        const updates = main.channels.cache.find(c => c.name === "updates") as TextChannel

        const many = next.builders.length > 1
        const mentions = next.builders.map(id => `<@${id}>`)
        const list = many ? mentions.map(m => `• ${m}`).join("\n") : mentions[0]
        const wholeDamnThing = many ? `:\n${list}\n\nA` : ` ${list}, a`

        const embed: Discord.MessageEmbedOptions = {
            author: { name: "New banner!" },
            description: `This week's banner was built by${wholeDamnThing}nd it's located in **${next.location}**.`,
            image: next
        }

        if (next.description) embed.description += `\n\n${quote(next.description)}`

        await updates.sendSuccess(embed)
        await next.softRemove()
        client.logger.info("Updated banner with first image in queue!")
    }
}
