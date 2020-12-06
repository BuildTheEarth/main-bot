import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from "typeorm"

export type ModpackImageKey = "logo" | "1" | "2" | "3" | "4" | "5"
export type ModpackImageSet = "queue" | "store"

@Entity({ name: "modpack_images" })
export default class ModpackImage extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    key: ModpackImageKey

    @Column()
    set: ModpackImageSet

    @Column()
    url: string

    @Column({ nullable: true })
    credit?: string
}
