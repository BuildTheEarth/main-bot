import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    DeleteDateColumn,
    BaseEntity
} from "typeorm"
import SnowflakeColumn from "./decorators/SnowflakeColumn"

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

    @SnowflakeColumn()
    creator: string

    @DeleteDateColumn({ name: "deleted_at" })
    deletedAt?: Date
}
