import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    DeleteDateColumn,
    BaseEntity,
    LessThan
} from "typeorm"
import SnowflakeColumn from "./decorators/SnowflakeColumn"
import Discord from "discord.js"

@Entity({ name: "suggestions" })
export default class Suggestion extends BaseEntity {
    static ALPHABET = "abcdefghijklmnopqrstuvwxyz"

    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    number?: number

    @Column({ nullable: true })
    extends?: number

    @SnowflakeColumn()
    author: string

    @Column()
    anonymous: boolean

    @Column()
    title: string

    @Column({ length: 2048 })
    body: string

    @Column({ nullable: true })
    teams?: string

    @Column({ nullable: true })
    status?: "approved" | "rejected" | "forwarded" | "in-progress" | "information"

    @SnowflakeColumn()
    message: string

    @Column()
    staff: boolean

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date

    @DeleteDateColumn({ name: "deleted_at" })
    deletedAt: Date

    @SnowflakeColumn({ nullable: true })
    deleter?: string

    static async findNumber(staff: boolean) {
        const { max }: { max: number } = await this.getRepository()
            .createQueryBuilder("suggestion")
            .select("MAX(suggestion.number)", "max")
            .where({ staff })
            .getRawOne()
        if (!max) return 1
        return max + 1
    }

    async getDisplayNumber(): Promise<string> {
        if (!this.extends) {
            return this.number.toString()
        } else {
            const extenders = await Suggestion.find({
                where: {
                    extends: this.extends,
                    createdAt: LessThan(new Date())
                }
            })
            const letter = Suggestion.ALPHABET[extenders.length]
            return this.extends + letter
        }
    }

    async displayEmbed(author: Discord.User): Promise<Discord.MessageEmbedOptions> {
        const displayNumber = await this.getDisplayNumber()
        const embed: Discord.MessageEmbedOptions = {
            color: "#999999",
            author: { name: `#${displayNumber} — ${this.title}` },
            description: this.body,
            fields: []
        }

        if (!this.anonymous) {
            embed.fields.push({ name: "Author", value: `<@${this.author}>` })
            embed.thumbnail = {
                url: author.displayAvatarURL({
                    size: 128,
                    format: "png",
                    dynamic: true
                })
            }
        }
        if (this.teams) {
            embed.fields.push({ name: "Team/s", value: this.teams })
        }

        return embed
    }
}
