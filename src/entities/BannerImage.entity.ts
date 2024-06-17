import typeorm from "typeorm"
import Discord from "discord.js"
import type Client from "../struct/Client.js"
import { quote } from "@buildtheearth/bot-utils"
import { Cron } from "croner"
import unicode from "./transformers/unicode.transformer.js"
import fetch from "node-fetch"

@typeorm.Entity({ name: "banner_images" })
export default class BannerImage extends typeorm.BaseEntity {
    @typeorm.PrimaryGeneratedColumn()
    id!: number

    @typeorm.Column()
    url!: string

    @typeorm.Column()
    credit!: string

    @typeorm.Column()
    location!: string

    @typeorm.Column({ length: 512, nullable: true, transformer: unicode })
    description?: string

    @typeorm.DeleteDateColumn({ name: "deleted_at" })
    deletedAt?: Date

    format(): string {
        return `**#${this.id}:** [Link](${this.url}), by ${this.credit}`
    }

    static async cycle(client: Client): Promise<void> {
        if (!client.customGuilds.main().features.includes("BANNER")) return
        const next = await this.findOne({ order: { id: "ASC" } })

        if (!next) {
            client.logger.warn("[BannerImage] Queue is empty; cannot update banner.")
            return
        }
        const bannerArrBuffer = await (await fetch(next.url)).arrayBuffer()

        const bannerBuffer = Buffer.from(bannerArrBuffer)

        await client.customGuilds
            .main()
            .setBanner(bannerBuffer, "Updated banner with first image in queue.")
            .catch(e => console.log(e))

        const updates = (await client.customGuilds.main()).channels.cache.find(
            channel => channel.name === "updates"
        ) as Discord.TextChannel

        const embed: Discord.APIEmbed = {
            author: { name: "New banner!" },
            description: `This week's banner was built by **${next.credit}**, and it's located in **${next.location}**.`,
            image: next
        }

        if (next.description) embed.description += `\n\n${quote(next.description)}`

        await client.response.sendSuccess(updates, embed)
        await next.softRemove()
        client.logger.info("Updated banner with first image in queue.")
    }

    static schedule(client: Client): void {
        if (client.bannerCycleTimeout) client.bannerCycleTimeout.stop()

        client.bannerCycleTimeout = new Cron("0 0 * * 1", () => {
            this.cycle(client)
        })
    }
}
