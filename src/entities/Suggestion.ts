import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    BaseEntity,
    LessThan
} from "typeorm"
import SnowflakeColumn from "./decorators/SnowflakeColumn"

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

    @Column({ length: 2048 })
    body: string

    @Column()
    teams: string

    @Column()
    status: "approved" | "rejected" | "forwarded" | "in-progress" | "information"

    @SnowflakeColumn()
    message: string

    @Column()
    staff: boolean

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date

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

    static async findNumber(staff: boolean) {
        const last = await this.findOne({ where: { staff } })
        if (!last) return 1
        return last.number + 1
    }
}
