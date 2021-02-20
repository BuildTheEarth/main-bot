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

    @Column()
    credit: string

    @Column()
    location: string

    @Column({ length: 512, nullable: true })
    description?: string

    @DeleteDateColumn({ name: "deleted_at" })
    deletedAt?: Date

    format(): string {
        return `**#${this.id}:** [Link](${this.url}), by ${this.credit}`
    }

    private static cycleTimeout: NodeJS.Timeout

    static async cycle(client: Client): Promise<void> {
        if (!client.guilds.main.features.includes("BANNER")) return
        const next = await this.findOne({ order: { id: "ASC" } })

        if (!next) {
            client.logger.warn("[BannerImage] Queue is empty; cannot update banner.")
            return
        }

        await client.guilds.main.setBanner(next.url)
        const updates = client.guilds.main.channels.cache.find(
            channel => channel.name === "updates"
        ) as TextChannel

        const embed: Discord.MessageEmbedOptions = {
            author: { name: "New banner!" },
            description: `This week's banner was built by **${next.credit}**, and it's located in **${next.location}**.`,
            image: next
        }

        if (next.description) embed.description += `\n\n${quote(next.description)}`

        await updates.sendSuccess(embed)
        await next.softRemove()
        client.logger.info("Updated banner with first image in queue!")
        this.schedule(client)
    }

    static schedule(client: Client): void {
        if (this.cycleTimeout) clearTimeout(this.cycleTimeout)
        const now = new Date()
        const monday = new Date()
        const today = now.getDay()
        const offset = 8 - today
        const mondate = now.getDate() + offset
        monday.setDate(mondate)
        monday.setUTCHours(0, 0, 0, 0)
        const tillMonday = monday.getTime() - Date.now()

        this.cycleTimeout = setTimeout(() => {
            this.cycle(client)
        }, tillMonday)
    }
}
