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

    format(compact: boolean = false): string {
        if (compact) {
            return this.credit
                ? `**#${this.key}:** <${this.url}> (${this.credit})`
                : `**${this.key}:** <${this.url}>`
        } else {
            return this.credit
                ? `• **ID:** ${this.key}\n• **URL:** <${this.url}>\n• **Credit:** ${this.credit}`
                : `• **Logo**\n• **URL:** <${this.url}>`
        }
    }
}
