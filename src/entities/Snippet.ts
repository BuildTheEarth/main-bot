import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from "typeorm"

@Entity({ name: "snippets" })
export default class Snippet extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 32 })
    name: string

    @Column({ length: 2 })
    language: string

    @Column({ length: 2048 })
    body: string
}
