import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn
} from "typeorm"
import SnowflakeColumn from "./decorators/SnowflakeColumn"
import Client from "../struct/Client"
import GuildMember from "../struct/discord/GuildMember"
import milliseconds from "./transformers/milliseconds"

@Entity({ name: "timed_punishments" })
export default class TimedPunishment extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @SnowflakeColumn()
    member: string

    @Column()
    type: "mute" | "ban"

    @Column({ transformer: milliseconds })
    length: number

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date

    get end(): Date {
        return new Date(this.createdAt.getTime() + this.length)
    }

    undoTimeout: NodeJS.Timeout

    async undo(client: Client): Promise<void> {
        clearTimeout(this.undoTimeout)
        if (this.type === "mute") {
            const member: GuildMember = await client.guilds.main.members
                .fetch({ user: this.member, cache: true })
                .catch(() => null)
            if (!member) return
            member.unmute("End of punishment")
        } else if (this.type === "ban") {
            await client.guilds.main.members
                .unban(this.member, "End of punishment")
                .catch(() => null)
        }
    }

    schedule(client: Client): Promise<void> {
        if (this.length === 0) return
        const timeout = this.end.getTime() - Date.now()
        this.undoTimeout = setTimeout(async () => {
            await this.undo(client)
            await this.remove()
        }, timeout)
    }
}
