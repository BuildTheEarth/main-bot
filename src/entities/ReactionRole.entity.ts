import typeorm from "typeorm"

@typeorm.Entity({name: "reaction_roles"})
export default class ReactionRole {
    @typeorm.PrimaryGeneratedColumn()
    id!: number
}