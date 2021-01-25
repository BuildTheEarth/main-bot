import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    DeleteDateColumn,
    BaseEntity
} from "typeorm"

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
}
