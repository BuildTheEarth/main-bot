import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    DeleteDateColumn
} from "typeorm"
import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import millisecondTransformer from "../util/millisecondTransformer"

@Entity({ name: "timed_punishments" })
export default class TimedPunishment extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 18 })
    member: string

    @Column()
    type: "mute" | "ban"

    @Column({ transformer: millisecondTransformer })
    length: number

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date

    @DeleteDateColumn({ name: "deleted_at" })
    deletedAt: Date

    get end(): Date {
        return new Date(this.createdAt.getTime() + this.length)
    }

    undoTimeout: NodeJS.Timeout

    async undo(client: Client) {
        clearTimeout(this.undoTimeout)
        const guild = client.guilds.cache.get(client.config.guilds.main)
        if (this.type === "mute") {
            const member: GuildMember = await guild.members
                .fetch({ user: this.member, cache: true })
                .catch(() => null)
            if (!member) return
            member.unmute("End of punishment")
        } else if (this.type === "ban") {
            await guild.members.unban(this.member, "End of punishment").catch(() => null)
        }
    }

    schedule(client: Client) {
        if (this.length === 0) return
        const timeout = this.end.getTime() - Date.now()
        this.undoTimeout = setTimeout(async () => {
            await this.undo(client)
            await this.remove()
        }, timeout)
    }
}
